// Unified analytics helpers for GA4, GTM (dataLayer), and Meta Pixel

const dl = () => {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
};

export const trackPageView = (path) => {
  try {
    dl().push({ event: "page_view", page_path: path });
    if (window.gtag) {
      window.gtag("event", "page_view", { page_path: path });
    }
    if (window.fbq) {
      window.fbq("track", "PageView");
    }
  } catch {
    return;
  }
};

export const trackViewItem = (item) => {
  const price = parseFloat(String(item.price).replace(/[৳$\s]/g, "")) || 0;
  const payload = {
    event: "view_item",
    ecommerce: {
      currency: "BDT",
      value: price,
      items: [
        {
          item_id: String(item.id),
          item_name: item.title,
          item_category: item.category,
          price,
          quantity: 1,
        },
      ],
    },
  };
  dl().push(payload);
  if (window.gtag) window.gtag("event", "view_item", payload.ecommerce);
  if (window.fbq)
    window.fbq("track", "ViewContent", { value: price, currency: "BDT" });
};

export const trackAddToCart = (item, quantity = 1, selectedSize = "") => {
  const price = parseFloat(String(item.price).replace(/[৳$\s]/g, "")) || 0;
  const payload = {
    event: "add_to_cart",
    ecommerce: {
      currency: "BDT",
      value: price * quantity,
      items: [
        {
          item_id: String(item.id),
          item_name: item.title,
          item_category: item.category,
          price,
          quantity,
          item_variant: selectedSize,
        },
      ],
    },
  };
  dl().push(payload);
  if (window.gtag) window.gtag("event", "add_to_cart", payload.ecommerce);
  if (window.fbq)
    window.fbq("track", "AddToCart", {
      value: price * quantity,
      currency: "BDT",
      contents: [{ id: String(item.id), quantity }],
      content_type: "product",
    });
};

export const trackViewCart = (items) => {
  const parsed = items.map((it) => {
    const price = parseFloat(String(it.price).replace(/[৳$\s]/g, "")) || 0;
    return {
      item_id: String(it.id),
      item_name: it.title,
      item_category: it.category,
      price,
      quantity: it.quantity,
      item_variant: it.selectedSize,
    };
  });
  dl().push({ event: "view_cart", ecommerce: { items: parsed } });
  if (window.gtag) window.gtag("event", "view_cart", { items: parsed });
};

export const trackBeginCheckout = (items, value = 0) => {
  dl().push({ event: "begin_checkout", ecommerce: { value, currency: "BDT", items } });
  if (window.gtag)
    window.gtag("event", "begin_checkout", { value, currency: "BDT", items });
  if (window.fbq)
    window.fbq("track", "InitiateCheckout", { value, currency: "BDT" });
};

export const trackPurchase = (orderId, items, value) => {
  const payload = { transaction_id: String(orderId), value, currency: "BDT", items };
  dl().push({ event: "purchase", ecommerce: payload });
  if (window.gtag) window.gtag("event", "purchase", payload);
  if (window.fbq) window.fbq("track", "Purchase", { value, currency: "BDT" });
};


