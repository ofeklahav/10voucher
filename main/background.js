const logoCache = new Map();
let voucherCache = null;

async function getBase64Image(url) {
  if (logoCache.has(url)) {
    return logoCache.get(url);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return '';
    }
    const blob = await response.blob();
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(blob);
    });

    logoCache.set(url, base64);
    return base64;
  } catch (error) {
    return '';
  }
}

async function fetchVoucherData(orderLink) {
  try {
    const response = await fetch(orderLink);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data && data.cardId && data.balance && data.logo) {
      const base64Logo = await getBase64Image(data.logo);
      return {
        cardId: data.cardId,
        cardPin: data.cardPin,
        balance: data.balance,
        logo: base64Logo,
        orderId: new URL(orderLink).searchParams.get('orderId')
      };
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function fetchAllOrderLinks(dateBiases) {
  try {
    const fetchPromises = dateBiases.map(async (bias) => {
      const payload = { dateBias: bias.toString() };
      const response = await fetch('https://www.10bis.co.il/NextApi/UserTransactionsReport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }
      const data = await response.json();
      return (data.Data.orderList || []).map(order => ({
        link: `https://api.10bis.co.il/api/v1/VoucherCards?orderId=${order.orderId}`,
        orderId: order.orderId
      }));
    });

    const results = await Promise.all(fetchPromises);
    return results.flat();
  } catch (error) {
    return [];
  }
}

async function getVouchersByMonths(months) {
  const biases = Array.from({ length: months }, (_, i) => -i);
  const allOrderLinks = await fetchAllOrderLinks(biases);
  const voucherPromises = allOrderLinks.map(order => fetchVoucherData(order.link));
  const results = await Promise.all(voucherPromises);
  const vouchers = results.filter(voucher => voucher !== null);
  voucherCache = vouchers;
  return vouchers;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchVouchersByMonths') {
    (async () => {
      const vouchers = await getVouchersByMonths(request.months);
      sendResponse({ vouchers });
    })();
    return true;
  } else if (request.action === 'refreshVouchers') {
    (async () => {
      voucherCache = null;
      const vouchers = await getVouchersByMonths(request.months);
      sendResponse({ vouchers });
    })();
    return true;
  }
});