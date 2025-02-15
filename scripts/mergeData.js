import fs from 'fs/promises';
import Papa from 'papaparse';
import path from 'path';

async function mergeData() {
    try {
        // 取得目前工作目錄
        const currentDir = process.cwd();
        console.log('目前工作目錄:', currentDir);

        // 讀取 cunli.json
        const cunliPath = path.join(currentDir, './scripts/source/cunli.json');
        console.log('嘗試讀取 cunli.json 的路徑:', cunliPath);
        const cunliData = JSON.parse(await fs.readFile(cunliPath, 'utf8'));
        console.log('成功讀取 cunli.json');
        
        // 準備存放最終資料的物件
        const fiaData = {};
        
        // 從 cunli.json 獲取所有村里代碼
        const villCodes = cunliData.objects['20210324'].geometries.map(g => g.properties.VILLCODE);
        console.log(`找到 ${villCodes.length} 個村里代碼`);
        
        // 初始化每個村里的資料結構
        villCodes.forEach(code => {
            fiaData[code] = {};
        });

        // 處理每一年的資料 (2011-2022)
        const years = Array.from({length: 12}, (_, i) => 2014 + i);
        
        for (const year of years) {
            try {
                // 讀取該年的 CSV 檔案
                const csvPath = path.join(currentDir, `./scripts/source/csv/${year}.csv`);
                console.log(`嘗試讀取 ${year}.csv 的路徑:`, csvPath);
                const csvContent = await fs.readFile(csvPath, 'utf8');
                console.log(`成功讀取 ${year}.csv`);
                
                // 解析 CSV
                const { data } = Papa.parse(csvContent, {
                    header: true,
                    skipEmptyLines: true
                });
                console.log(`${year}.csv 包含 ${data.length} 筆資料`);

                let processedCount = 0;
                // 處理每一筆資料
                data.forEach(row => {
                    // 從村里資訊構建 VILLCODE
                    const countyName = row['縣市'];
                    const townName = row['鄉鎮市區'];
                    const villName = row['村里'];

                    // 在 cunli.json 中找到對應的 VILLCODE
                    const geometry = cunliData.objects['20210324'].geometries.find(g => 
                        g.properties.COUNTYNAME === countyName &&
                        g.properties.TOWNNAME === townName &&
                        g.properties.VILLNAME === villName
                    );

                    if (geometry) {
                        const villCode = geometry.properties.VILLCODE;
                        processedCount++;
                        
                        // 建立該年度的資料
                        fiaData[villCode][year] = {
                            adm: parseInt(row['納稅單位']),
                            total: parseInt(row['綜合所得總額']),
                            avg: parseFloat(row['平均數']),
                            mid: parseFloat(row['中位數']),
                            mid1: parseFloat(row['第一分位數']),
                            mid3: parseFloat(row['第三分位數']),
                            sd: parseFloat(row['標準差']),
                            cv: parseFloat(row['變異係數'])
                        };
                    }
                });
                console.log(`${year}年成功處理 ${processedCount}/${data.length} 筆資料`);

            } catch (error) {
                console.error(`處理 ${year} 年資料時發生錯誤:`, error);
            }
        }

        // 寫入結果到 fia_data.json
        const outputPath = path.join(currentDir, './public/fia_data_v2.json');
        console.log('準備寫入輸出檔案:', outputPath);
        await fs.writeFile(
            outputPath,
            JSON.stringify(fiaData, null, 2),
            'utf8'
        );

        console.log('資料合併完成！');
        console.log('輸出檔案位置:', outputPath);

    } catch (error) {
        console.error('處理資料時發生錯誤:', error);
        console.error('錯誤詳情:', error.stack);
    }
}

// 執行合併
mergeData();

// 如果要在 Next.js API route 中使用，可以修改成這樣：
export async function mergeDataApi(req, res) {
    try {
        await mergeData();
        res.status(200).json({ message: '資料合併完成' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}