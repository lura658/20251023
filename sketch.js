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
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

window.addEventListener('message', function (event) {
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        finalScore = data.score; 
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // --- 重置爆炸狀態 ---
        let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;
        
        if (percentage < 90) {
            explosionTriggered = false; 
        }

        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // 【關鍵修正點：將畫布附加到指定的 DOM 元素】
    let canvas = createCanvas(windowWidth / 2, windowHeight / 2); 
    // 假設您在 index.html 中新增了一個 id="p5-canvas-container" 的 div
    canvas.parent('p5-canvas-container'); 
    
    // 為了煙火動畫，必須讓 draw() 持續循環
    colorMode(HSB, 360, 100, 100, 255); 
} 

// --- 煙火粒子生成函數 (簡化版) ---
function createFireworkExplosion(x, y, count, fireworkHue) {
    if (explosionTriggered) return;
    
    explosionParticles = []; 
    
    for (let i = 0; i < count; i++) {
        let angle = random(TWO_PI); 
        let speed = random(3, 10); 
        
        // 使用 HSB 隨機化顏色
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
    // 【關鍵修正點：半透明背景，用於殘影效果】
    // 設為黑色背景 (色相 0, 飽和 0, 亮度 0)
    background(0, 0, 0, 50); // 每幀繪製半透明的黑色，形成殘影
    
    // 計算百分比時檢查 maxScore 是否為 0
    let percentage = 0;
    if (maxScore > 0) {
        percentage = (finalScore / maxScore) * 100;
    }
    
    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色 (綠色)
        fill(120, 100, 80); 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // !!! 煙火特效觸發 !!!
        if (!explosionTriggered) {
            createFireworkExplosion(width / 2, height / 2, 80, random(360));
        }
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色
        fill(60, 100, 90); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色
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
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        fill(120, 100, 80, 150); 
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        fill(60, 100, 90, 150); 
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    // -----------------------------------------------------------------
    // C. 煙火粒子更新與繪製
    // -----------------------------------------------------------------
    
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
}
