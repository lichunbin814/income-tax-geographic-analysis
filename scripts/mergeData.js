import fs from 'fs/promises';
import Papa from 'papaparse';
import path from 'path';

function parseAddress(addressStr) {
    // 移除可能的空白
    addressStr = addressStr.trim();
    
    // 處理縣市名稱
    // let countyName, townName;
    const mainCuntrySplitIndex = addressStr.indexOf('市');
    const countySplitIndex = ~mainCuntrySplitIndex && mainCuntrySplitIndex <= 2 ? mainCuntrySplitIndex : addressStr.indexOf('縣');
    /*
    addressStr 臺東縣太麻里鄉
countySplitIndex -1
    */
 
    const countyName = addressStr.substring(0, countySplitIndex + 1);
    const townName = addressStr.substring(countySplitIndex + 1);
    // if (addressStr.includes('市')) {
    //     // 處理直轄市和省轄市
    //     const parts = addressStr.split('市');
    //     countyName = parts[0] + '市';
    //     townName = parts[1].replace(/(區|鄉|鎮)$/, '');
    // } else if (addressStr.includes('縣')) {
    //     // 處理縣
    //     const parts = addressStr.split('縣');
    //     countyName = parts[0] + '縣';
    //     townName = parts[1].replace(/(區|鄉|鎮)$/, '');
    // }

    // // 判斷鄉鎮市區的類型並加上對應的後綴
    // let townSuffix = '';
    // if (addressStr.includes('區')) {
    //     townSuffix = '區';
    // } else if (addressStr.includes('鎮')) {
    //     townSuffix = '鎮';
    // } else if (addressStr.includes('鄉')) {
    //     townSuffix = '鄉';
    // }
    
    // // 組合完整的鄉鎮市區名稱
    // townName = townName + townSuffix;

    return {
        countyName,
        townName
    };
}

async function mergeData() {
    const currentYear = new Date().getFullYear();
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

        // 處理過去十年的資料 
        // const years = Array.from({length: 10}, (_, i) => currentYear - i);
        
        for (const year of [2021]) {
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
                let notFoundCount = 0;
                
                // 處理每一筆資料
                data.forEach(row => {
                    // 解析地址
                    const { countyName, townName } = parseAddress(row['縣市別']);
                    const villName = row['村里'];
        

                    if(villName === '合計' || villName === '其他'){
                        return;
                    }

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
                            adm: parseInt(row['納稅單位(戶)']),
                            total: parseInt(row['綜合所得總額']),
                            avg: parseFloat(row['平均數']),
                            mid: parseFloat(row['中位數']),
                            mid1: parseFloat(row['第一分位數']),
                            mid3: parseFloat(row['第三分位數']),
                            sd: parseFloat(row['標準差']),
                            cv: parseFloat(row['變異係數'])
                        };
                    } else {
                        notFoundCount++;
                        console.warn(`找不到對應的村里代碼: 縣市=${countyName}, 鄉鎮=${townName}, 村里=${villName}`);
                        console.warn('原始資料:', row['縣市別']);
                    }
                });
                console.log(`${year}年成功處理 ${processedCount}/${data.length} 筆資料`);
                console.log(`${year}年未找到對應代碼: ${notFoundCount} 筆`);

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