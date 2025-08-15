/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

window.addEventListener("message", function(event) {
    if (event.source == window && event.data.type && event.data.type == "DOWNLOAD_VOUCHERS_PDF") {
        const vouchers = event.data.vouchers;
        generatePDF(vouchers);
    }
});

async function generatePDF(vouchers) {
    // Correctly initialize jsPDF using destructuring
    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    const pageCount = 2; // Assuming you have 2 pages of content to convert to PDF
    const margin = 15;
    const pageHeight = doc.internal.pageSize.height;
    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;

    // Create a temporary container for the elements to be converted
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.padding = '15px';
    container.style.direction = 'rtl';
    container.style.fontFamily = 'sans-serif';
    container.style.width = `${A4_WIDTH_MM}mm`;

    // The new HTML content with a flex container for two-column layout
    const htmlContent = `
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between;">
            ${vouchers.map((voucher, index) => `
                <div class="voucher-card" style="width: 48%; border: 1px solid #ccc; padding: 10px; margin-bottom: 20px; font-family: sans-serif; text-align: center;">
                  <div class="voucher-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <img src="${voucher.logo}" alt="Logo" class="voucher-logo" style="width: 50px; height: 50px;">
                    <h3 style="margin: 0; font-size: 1.2em;">שובר #${voucher.orderId}</h3>
                  </div>
                  <div class="voucher-body">
                    <div class="voucher-code" style="font-size: 1.5em; font-weight: bold; margin-bottom: 5px;">${voucher.cardId}-${voucher.cardPin}</div>
                    <div class="voucher-balance" style="font-size: 1.2em; color: #555;">יתרה: ${voucher.balance} ש"ח</div>
                  </div>
                  <div class="voucher-barcode" style="margin-top: 15px;">
                    <svg id="pdf-barcode-${index}" style="width: 100%; max-width: 250px;"></svg>
                  </div>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // Now, render the barcodes using JsBarcode
    vouchers.forEach((v, index) => {
        const barcodeElement = document.getElementById(`pdf-barcode-${index}`);
        if (barcodeElement) {
            JsBarcode(barcodeElement, `${v.cardId}${v.cardPin}`, {
                format: "CODE128",
                displayValue: false,
                height: 50,
                width: 2
            });
        }
    });

    // Convert the container to a PDF
    try {
        const canvas = await html2canvas(container, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = A4_WIDTH_MM;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft * -1;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        doc.save('vouchers.pdf');
    } catch (error) {
        console.error("Error during PDF generation:", error);
    } finally {
        // Clean up the temporary container
        document.body.removeChild(container);
    }
}