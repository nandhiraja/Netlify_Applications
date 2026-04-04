import { generateBackendBill, generateDynamicBackendKOT, getCounterNameForCategory } from './backendPrintTemplates';

// A single function to send exactly what the backend expects
export const sendTo9101Printer = async (html, title) => {
    try {
        const response = await fetch('http://localhost:9101/print', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                html: html,
                title: title
            })
        });
        
        if (!response.ok) {
            console.error(`[Backend 9101 Print] HTTP Error! status: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (err) {
        console.error(`[Backend 9101 Print] Failed to print ${title}:`, err);
        return { success: false, message: err.message };
    }
};

export const triggerBackend9101Prints = async (
    orderId, 
    kot_code, 
    orderDetails, 
    orderType, 
    storeName, 
    ADDRESS_LINE_1, 
    ADDRESS_LINE_2, 
    GST_NUMBER, 
    FSSAI_NUMBER, 
    CIN_NUMBER
) => {
    console.log('[Backend 9101 Print] Starting new standalone printer flow (9101)...');
    
    // 1. Generate and Send Bill
    try {
        const billHtml = generateBackendBill(
            orderId, kot_code, orderDetails, orderType, storeName, 
            ADDRESS_LINE_1, ADDRESS_LINE_2, GST_NUMBER, FSSAI_NUMBER, CIN_NUMBER
        );
        
        console.log('[Backend 9101 Print] Sending Bill...');
        await sendTo9101Printer(billHtml, `Bill_${orderId}`);
    } catch(err) {
        console.error('[Backend 9101 Print] Error generating/sending bill:', err);
    }
    
    // 2. Group items by counter name
    const groupedItems = {};
    
    if (orderDetails && orderDetails.items) {
        orderDetails.items.forEach(item => {
            const counterName = getCounterNameForCategory(String(item.categoryId));
            if (!groupedItems[counterName]) {
                groupedItems[counterName] = [];
            }
            groupedItems[counterName].push(item);
        });
    }

    // 3. Generate and Send KOTs based on the grouping
    // We delay slightly between prints to ensure the printer has time to breathe 
    const counterNames = Object.keys(groupedItems);
    
    for (let i = 0; i < counterNames.length; i++) {
        const counterName = counterNames[i];
        const itemsForCounter = groupedItems[counterName];
        
        try {
            const kotHtml = generateDynamicBackendKOT(
                orderId, 
                kot_code, 
                orderType, 
                storeName, 
                counterName, 
                itemsForCounter
            );
            
            if (kotHtml) {
                // Wait 1000ms between print jobs to ensure sequence and printer queueing if needed
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                console.log(`[Backend 9101 Print] Sending KOT for ${counterName}...`);
                const result = await sendTo9101Printer(kotHtml, `${counterName.replace(/\s+/g, '_')}_KOT_${orderId}`);
                console.log(`[Backend 9101 Print] Result for ${counterName}:`, result);
            }
        } catch(err) {
            console.error(`[Backend 9101 Print] Error sending KOT for ${counterName}:`, err);
        }
    }
    
    console.log('[Backend 9101 Print] Finished all 9101 print jobs');
};
