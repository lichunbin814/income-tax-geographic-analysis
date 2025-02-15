import fs from 'fs/promises';
import Papa from 'papaparse';

async function mergeData() {
    try {
        // 讀取 cunli.json
        const cunliData = JSON.parse(await fs.readFile('./source/cunli.json', 'utf8'));
        
        // 準備存放最終資料的物件
        const fiaData = {};
        
        // 從 cunli.json 獲取所有村里代碼
        const villCodes = cunliData.objects['20210324'].geometries.map(g => g.properties.VILLCODE);
        
        // 初始化每個村里的資料結構
        villCodes.forEach(code => {
            fiaData[code] = {};
        });

        // 處理每一年的資料 (2011-2022)
        const years = Array.from({length: 12}, (_, i) => 2011 + i);
        
        for (const year of years) {
            try {
                // 讀取該年的 CSV 檔案
                const csvContent = await fs.readFile(`./data/${year}.csv`, 'utf8');
                
                // 解析 CSV
                const { data } = Papa.parse(csvContent, {
                    header: true,
                    skipEmptyLines: true
                });

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

            } catch (error) {
                console.error(`處理 ${year} 年資料時發生錯誤:`, error);
            }
        }

        // 寫入結果到 fia_data.json
        await fs.writeFile(
            './public/fia_data_v2.json',
            JSON.stringify(fiaData, null, 2),
            'utf8'
        );

        console.log('資料合併完成！');

    } catch (error) {
        console.error('處理資料時發生錯誤:', error);
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
