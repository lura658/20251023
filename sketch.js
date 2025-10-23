// =================================================================
// 全域變數設定
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 0;
// 【修正點 1】為 scoreText 設定初始值，確保畫面啟動時有內容
let scoreText = "等待成績訊息..."; 

// --- 煙火特效相關變數 ---
// 儲存所有爆炸粒子的陣列
let explosionParticles = [];
// 爆炸是否剛被觸發（用於只執行一次性爆炸）
let explosionTriggered = false; 

// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // --- 重置爆炸狀態 ---
        let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;
        
        // 只有分數不夠高時才重置 trigger，這樣下次拿到高分才能爆炸
        if (percentage < 90) {
            explosionTriggered = false; 
        }

        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    // 為了煙火動畫，必須讓 draw() 持續循環
    // 移除 noLoop();
    // 啟用 HSB 顏色模式，讓煙火顏色更容易變動 (可選)
    colorMode(HSB, 360, 100, 100, 255); 
} 

// --- 煙火粒子生成函數 (簡化版) ---
function createFireworkExplosion(x, y, count, fireworkHue) {
    if (explosionTriggered) return;
    
    explosionParticles = []; // 清空舊的粒子
    
    for (let i = 0; i < count; i++) {
        let angle = random(TWO_PI); 
        let speed = random(3, 10); // 爆炸速度
        
        // 使用 HSB 隨機化顏色
        let particleColor = color(fireworkHue, random(80, 100), random(80, 100));

        let particle = {
            pos: createVector(x, y), // 初始位置
            vel: createVector(cos(angle) * speed, sin(angle) * speed), // 初始速度
            color: particleColor, 
            life: 255 // 生命值 (用於淡出效果)
        };
        explosionParticles.push(particle);
    }
    
    explosionTriggered = true; // 標記為已觸發
}


function draw() { 
    // 使用帶透明度的背景，產生粒子拖曳的殘影效果
    background(0, 0, 0, 255); // 設為黑色背景 (色相 0, 飽和 0, 亮度 0)
    background(0, 0, 0, 50); // 每幀繪製半透明的黑色，形成殘影
    
    // 【修正點 2】在計算百分比前檢查 maxScore 是否為 0
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
            // 觸發煙火爆炸，使用隨機色相
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
        fill(0, 0, 80); // 使用白色/淺灰色顯示等待訊息
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
        // 畫一個大圓圈代表完美 
        fill(120, 100, 80, 150); // 帶透明度的綠色
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 
        fill(60, 100, 90, 150); // 帶透明度的黃色
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    // -----------------------------------------------------------------
    // C. 煙火粒子更新與繪製
    // -----------------------------------------------------------------
    
    let gravity = createVector(0, 0.1); // 模擬重力（調小一點，讓爆炸時間長一點）
    
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        let p = explosionParticles[i];
        
        // 1. 更新速度 (加上重力)
        p.vel.add(gravity); 
        
        // 2. 更新位置
        p.pos.add(p.vel);
        
        // 3. 減少生命值 (製造淡出效果)
        p.life -= 3; // 調整淡出速度
        
        // 4. 繪製粒子
        push();
        // 使用粒子的生命值來控制透明度
        let h = hue(p.color);
        let s = saturation(p.color);
        let b = brightness(p.color);
        fill(h, s, b, p.life);
        noStroke();
        ellipse(p.pos.x, p.pos.y, 4); // 繪製小圓點粒子
        pop();
        
        // 5. 移除死亡的粒子
        if (p.life <= 0) {
            explosionParticles.splice(i, 1);
        }
    }
}
