// =================================================================
// 全域變數設定
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 0;
// 確保畫面啟動時有內容顯示
let scoreText = "等待成績訊息..."; 

// --- 煙火特效相關變數 ---
let explosionParticles = [];
let explosionTriggered = false; 

// =================================================================
// 步驟一：處理 H5P 傳送的分數訊息
// -----------------------------------------------------------------

window.addEventListener('message', function (event) {
    const data = event.data;
    
    // 檢查訊息類型是否為 H5P 成績，並確保從 iframe 接收
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
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

        // 強制 p5.js 重新繪製畫面 (雖然 draw() 已經在循環，但這確保了立即更新)
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // 【修正：固定畫布尺寸，確保版面穩定】
    let canvas = createCanvas(500, 300); 
    
    // 將畫布附加到 index.html 中 id="p5-canvas-container" 的 div
    canvas.parent('p5-canvas-container'); 
    
    // 使用 HSB 顏色模式，讓顏色控制更直覺
    colorMode(HSB, 360, 100, 100, 255); 
    
    // draw() 會持續循環，以運行動畫
} 

// --- 煙火粒子生成函數 ---
function createFireworkExplosion(x, y, count, fireworkHue) {
    if (explosionTriggered) return;
    
    explosionParticles = []; 
    
    for (let i = 0; i < count; i++) {
        let angle = random(TWO_PI); 
        let speed = random(3, 10); 
        
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
    // 使用帶透明度的黑色背景 (50/255)，產生粒子拖曳的殘影效果
    background(0, 0, 0, 50); 
    
    // 計算百分比
    let percentage = 0;
    if (maxScore > 0) {
        percentage = (finalScore / maxScore) * 100;
    }
    
    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 高分：綠色 (Hue 120)
        fill(120, 100, 100); 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // !!! 煙火特效觸發 !!!
        if (!explosionTriggered) {
            // 隨機產生一個色相的煙火
            createFireworkExplosion(width / 2, height / 2, 80, random(360));
        }
        
    } else if (percentage >= 60) {
        // 中等分數：黃色 (Hue 60)
        fill(60, 100, 90); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：紅色 (Hue 0)
        fill(0, 100, 80); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(0, 0, 95); // 幾乎白色
        text(scoreText, width / 2, height / 2 - 50);
    }

    // 顯示具體分數
    textSize(50);
    fill(0, 0, 95); // 幾乎白色
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // C. 煙火粒子更新與繪製
    // -----------------------------------------------------------------
    
    let gravity = createVector(0, 0.1); 
    
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        let p = explosionParticles[i];
        
        p.vel.add(gravity); // 加上重力
        p.pos.add(p.vel);   // 更新位置
        p.life -= 3;        // 減少生命值 (淡出)
        
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
}
