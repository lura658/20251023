// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// --- 新增: 煙火特效相關變數 ---
// 儲存所有爆炸粒子的陣列
let explosionParticles = [];
// 爆炸是否剛被觸發（用於只執行一次性爆炸）
let explosionTriggered = false; 


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
        
        // --- 新增: 重置爆炸狀態，準備下次繪製 ---
        // 只有分數 >= 90 且之前沒有觸發過時才設為 false，這樣下次 redraw() 才會爆炸
        let percentage = (finalScore / maxScore) * 100;
        if (percentage < 90) {
            explosionTriggered = false; // 只有在分數不夠高時才重置，避免重複爆炸
        } else if (percentage >= 90 && !explosionTriggered) {
             // 讓 draw() 被呼叫時能觸發爆炸 (見 draw() 內)
        }


        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
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
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    // 如果要看粒子動畫，必須移除 noLoop()，並將 background(255) 移到 draw()
    // 為了煙火動畫，我們需要讓 draw() 保持不斷循環！
    // 移除 noLoop(); 
} 

// --- 新增: 煙火粒子生成函數 (簡化版) ---
function createFireworkExplosion(x, y, count, fireworkColor) {
    // 避免重複爆炸
    if (explosionTriggered) return;
    
    explosionParticles = []; // 清空舊的粒子
    
    for (let i = 0; i < count; i++) {
        // 隨機角度
        let angle = random(TWO_PI); 
        // 隨機速度 (製造向外擴散效果)
        let speed = random(2, 8); 
        
        let particle = {
            pos: createVector(x, y), // 初始位置
            vel: createVector(cos(angle) * speed, sin(angle) * speed), // 初始速度
            color: fireworkColor, // 顏色
            life: 255 // 生命值 (用於淡出效果)
        };
        explosionParticles.push(particle);
    }
    
    explosionTriggered = true; // 標記為已觸發
}


function draw() { 
    background(255, 255, 255, 50); // 清除背景 (帶一點點透明度，製造殘影效果)

    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(0, 200, 50); // 綠色 [6]
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // !!! 煙火特效觸發 !!!
        if (!explosionTriggered) {
            createFireworkExplosion(width / 2, height / 2, 50, color(255, 181, 35));
        }
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 [6]
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 [6]
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 [7]
        fill(0, 200, 50, 150); // 帶透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 [4]
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    // -----------------------------------------------------------------
    // C. 煙火粒子更新與繪製
    // -----------------------------------------------------------------
    
    let gravity = createVector(0, 0.2); // 模擬重力
    
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        let p = explosionParticles[i];
        
        // 1. 更新速度 (加上重力)
        p.vel.add(gravity); 
        
        // 2. 更新位置
        p.pos.add(p.vel);
        
        // 3. 減少生命值 (製造淡出效果)
        p.life -= 5; 
        
        // 4. 繪製粒子
        push();
        let particleColor = color(red(p.color), green(p.color), blue(p.color), p.life);
        fill(particleColor);
        noStroke();
        ellipse(p.pos.x, p.pos.y, 5); // 繪製小圓點粒子
        pop();
        
        // 5. 移除死亡的粒子
        if (p.life <= 0) {
            explosionParticles.splice(i, 1);
        }
    }
}
