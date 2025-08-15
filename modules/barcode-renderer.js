window.addEventListener("message", function(event) {
  if (event.source == window && event.data.type && event.data.type == "RENDER_BARCODES") {
    event.data.vouchers.forEach((v, index) => {
      const barcodeElement = document.getElementById(`barcode-${index}`);
      if (barcodeElement) {
          try {
              JsBarcode(barcodeElement, `${v.cardId}${v.cardPin}`, {
                  format: 'CODE128',
                  displayValue: false,
                  width: 2,
                  height: 40
              });
          } catch (e) {
              console.error('Error generating barcode:', e);
          }
      }
    });
  }
});