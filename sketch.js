// =================================================================
// 全域變數設定
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 0;
// 【修正】給予初始值，避免畫面開始時顯示空白
let scoreText = "等待成績訊息..."; 

// --- 煙火特效相關變數 ---
let explosionParticles = [];
let explosionTriggered = false; 

// =================================================================
// 步驟一：處理 H5P 傳送的分數訊息
// -----------------------------------------------------------------

window.addEventListener('message', function (event) {
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; 
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // --- 重置爆炸狀態 ---
        let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;
        
        // 分數未達 90% 時重置煙火觸發狀態
        if (percentage < 90) {
            explosionTriggered = false; 
        }

        // 雖然 draw() 已經在循環，但這確保了立即更新
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // 【修正】使用固定尺寸，對應 index.html 中 #p5-canvas-container 的寬高
    let canvas = createCanvas(700, 400); 
    
    // 將畫布附加到 index.html 中 id="p5-canvas-container" 的 div
    canvas.parent('p5-canvas-container'); 
    
    // 讓 draw() 持續循環 (為了煙火動畫)，所以移除 noLoop()
    // 設置 HSB 顏色模式 (更適合動畫，但 draw 中仍使用 RGB/常規填色)
    colorMode(HSB, 360, 100, 100, 255); 
} 

// --- 煙火粒子生成函數 (必須加入，這是煙火的核心) ---
function createFireworkExplosion(x, y, count, fireworkHue) {
    if (explosionTriggered) return;
    
    explosionParticles = []; 
    
    for (let i = 0; i < count; i++) {
        let angle = random(TWO_PI); 
        let speed = random(3, 10); 
        
        // 使用 HSB 顏色
        let particleColor = color(fireworkHue, random(80, 100), random(80, 100));

        let particle = {
            pos: createVector(x, y), 
            vel: createVector(cos(angle) * speed, sin(angle) * speed), 
            color: particleColor, 
            life: 255 
        };
        explosionParticles.push(particle);
    }
    
    explosionTriggered = true; 
}


function draw() { 
    // 【修正】使用帶透明度的黑色背景，讓煙火有殘影效果
    background(0, 0, 0, 50); 
    
    // 計算百分比時檢查 maxScore 是否為 0
    let percentage = 0;
    if (maxScore > 0) {
        percentage = (finalScore / maxScore) * 100;
    }
    
    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (使用您提供的 RGB 顏色)
    // -----------------------------------------------------------------
    
    // 暫時切回 RGB 模式，以便使用您提供的顏色碼 (0-255)
    colorMode(RGB, 255); 
    
    if (percentage >= 90) {
        // 滿分或高分：綠色 (RGB)
        fill(0, 200, 50); 
        text("恭喜！優異成績！", width / 2, height / 2 - 80); // 調整 Y 軸位置
        
        // !!! 煙火特效觸發 !!!
        if (!explosionTriggered) {
            // 在 HSB 模式下生成煙火，所以暫時切回 HSB
            colorMode(HSB, 360, 100, 100, 255); 
            createFireworkExplosion(width / 2, height / 2, 80, random(360));
            colorMode(RGB, 255); // 切回 RGB
        }
        
    } else if (percentage >= 60) {
        // 中等分數：黃色 (RGB)
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 80);
        
    } else if (percentage > 0) {
        // 低分：紅色 (RGB)
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 80);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2 - 80);
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 20);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 (RGB)
        fill(0, 200, 50, 150); 
        noStroke();
        circle(width / 2, height / 2 + 100, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 (RGB)
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 100, 150, 150);
    }
    
    // -----------------------------------------------------------------
    // C. 煙火粒子更新與繪製 (必須切回 HSB 才能正確使用粒子的 color/life)
    // -----------------------------------------------------------------
    
    colorMode(HSB, 360, 100, 100, 255); // 切回 HSB
    
    let gravity = createVector(0, 0.1); 
    
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        let p = explosionParticles[i];
        
        p.vel.add(gravity); 
        p.pos.add(p.vel);
        p.life -= 3; 
        
        // 繪製粒子
        push();
        let h = hue(p.color);
        let s = saturation(p.color);
        let b = brightness(p.color);
        // 使用粒子的生命值來控制透明度
        fill(h, s, b, p.life);
        noStroke();
        ellipse(p.pos.x, p.pos.y, 4); 
        pop();
        
        // 移除死亡的粒子
        if (p.life <= 0) {
            explosionParticles.splice(i, 1);
        }
    }
    
    colorMode(RGB, 255); // 繪製結束，切回 RGB
}
