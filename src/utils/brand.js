// Lightweight obfuscation: store Base64 and decode at runtime
// Note: Frontend cannot fully prevent tampering; this only discourages casual edits.

const decode = (b64) => {
  try {
    return atob(b64);
  } catch {
    return "softwareseba";
  }
};

// "softwareseba" in Base64
const ENCODED_BRAND = "c29mdHdhcmVzZWJh";

// "softwareseba.com" in Base64
const ENCODED_DOMAIN = "c29mdHdhcmVzZWJhLmNvbQ==";

export const brandName = decode(ENCODED_BRAND);
export const brandDomain = decode(ENCODED_DOMAIN);


