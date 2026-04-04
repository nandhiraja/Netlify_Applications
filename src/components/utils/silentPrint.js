import { generateBackendBill, generateDynamicBackendKOT, getCounterNameForCategory } from './backendPrintTemplates';

// Global queue to ensure iframes process sequentially
let iframePrintQueue = Promise.resolve();

function printInHiddenIframe(htmlContent, documentTitle) {
    iframePrintQueue = iframePrintQueue.then(() => new Promise((resolve) => {
        // Create hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';

        document.body.appendChild(iframe);

        // Write content to iframe
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // Set document title for PDF save filename
        iframeDoc.title = documentTitle;

        let resolved = false;

        const cleanupAndResolve = () => {
            if (!resolved) {
                resolved = true;
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
                resolve();
            }
        };

        // Wait for content to load then print
        iframe.onload = () => {
            setTimeout(() => {
                try {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                    
                    // Allow time for print dialog/action before queuing next
                    setTimeout(() => {
                        cleanupAndResolve();
                    }, 1000);
                } catch (error) {
                    console.error('Print error:', error);
                    cleanupAndResolve();
                }
            }, 300);
        };

        // Fallback timeout in case onload fails
        setTimeout(cleanupAndResolve, 5000);
    }));
}


// Generate and print bill silently
export const silentPrintBill = (orderId, kot_code, orderDetails, orderType,storeName,ADDRESS_LINE_1,ADDRESS_LINE_2,GST_NUMBER,FSSAI_NUMBER,CIN_NUMBER) => {
    console.log("[Silent Print] BILL : ", orderType);
    const billHTML = generateBackendBill(orderId, kot_code, orderDetails, orderType,storeName,ADDRESS_LINE_1,ADDRESS_LINE_2,GST_NUMBER,FSSAI_NUMBER,CIN_NUMBER);
    printInHiddenIframe(billHTML, `Bill-${orderId}`);
};

// Generates KOTs dynamically based on filter (Food vs Coffee separation preserved for fallback logic)
const printGroupedFallbackKOTs = (orderId, kot_code, orderDetails, orderType, storeName, itemFilter) => {
    const itemsToProcess = orderDetails.items.filter(itemFilter);
    if (itemsToProcess.length === 0) return;

    const groupedItems = {};
    itemsToProcess.forEach(item => {
        const counterName = getCounterNameForCategory(String(item.categoryId));
        if (!groupedItems[counterName]) groupedItems[counterName] = [];
        groupedItems[counterName].push(item);
    });

    const counterNames = Object.keys(groupedItems);
    
    counterNames.forEach(counterName => {
        const items = groupedItems[counterName];
        const kotHtml = generateDynamicBackendKOT(orderId, kot_code, orderType, storeName, counterName, items);
        if (kotHtml) {
            printInHiddenIframe(kotHtml, `${counterName.replace(/\s+/g,'_')}-KOT-${orderId}`);
        }
    });
};

// Generate and print Food KOT silently
export const silentPrintFoodKOT = (orderId, kot_code, orderDetails ,orderType,storeName) => {
    console.log("[Silent Print] FOOD-KOTS : ", orderType);
    // Everything that is NOT coffee (9534540)
    printGroupedFallbackKOTs(orderId, kot_code, orderDetails, orderType, storeName, item => String(item.categoryId) !== "9534540");
};

// Generate and print Coffee KOT silently
export const silentPrintCoffeeKOT = (orderId, kot_code, orderDetails,orderType,storeName) => {
    console.log("[Silent Print] COFFEE-KOT : ", orderType);
    // Exactly coffee
    printGroupedFallbackKOTs(orderId, kot_code, orderDetails, orderType, storeName, item => String(item.categoryId) === "9534540");
};

// Print all documents silently (Used when 9100 completely fails)
export const silentPrintAll = (orderId, kot_code, orderDetails, orderType, storeName,ADDRESS_LINE_1,ADDRESS_LINE_2,GST_NUMBER,FSSAI_NUMBER,CIN_NUMBER) => {
    // 1. Print the generic Bill
    silentPrintBill(orderId, kot_code, orderDetails, orderType, storeName,ADDRESS_LINE_1,ADDRESS_LINE_2,GST_NUMBER,FSSAI_NUMBER,CIN_NUMBER);
    
    // 2. Iterate through ALL items, grouping them by their dynamic counter, and queueing KOTs
    printGroupedFallbackKOTs(orderId, kot_code, orderDetails, orderType, storeName, () => true);
};