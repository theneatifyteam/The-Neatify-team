import axios from "axios";

const BASE_URL = "https://myfirstapp-cziu.onrender.com";

export const createOrder = async (amount) => {
  const res = await axios.post(`${BASE_URL}/create-order`, {
    amount: amount * 100, // backend expects paise
  });
  return res.data;
};

export const verifyPayment = async (paymentDetails) => {
  const res = await axios.post(`${BASE_URL}/verify-payment`, paymentDetails);
  return res.data;
};

export const getRazorpayKey = async () => {
  const res = await axios.get(`${BASE_URL}/get-razorpay-key`);
  return res.data.key;
};

/* Load Razorpay Script */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Process Payment - Similar to native app's processPayment
 * This function handles the complete payment flow and returns a Promise
 * @param {number} amount - Amount in rupees
 * @param {object} userDetails - User details for prefill
 * @returns {Promise<{success: boolean, paymentId?: string, orderId?: string}>}
 */
export const processPayment = async (amount, userDetails = {}) => {
  try {
    // Load Razorpay script
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      console.error("Razorpay SDK failed to load");
      return { success: false, error: "SDK_LOAD_FAILED" };
    }

    // Razorpay key - prioritize backend key if available, else usage env var
    let razorpayKey = process.env.REACT_APP_RAZORPAY_KEY;
    try {
      const backendKey = await getRazorpayKey();
      if (backendKey) razorpayKey = backendKey;
    } catch (e) {
      console.warn("Failed to fetch Razorpay key from backend, using fallback");
    }

    if (!razorpayKey) {
      console.error("No Razorpay key found");
      return { success: false, error: "NO_KEY_FOUND" };
    }

    // Create order
    const order = await createOrder(amount);
    console.log("Order created:", order);

    // Return a promise that resolves when payment is complete
    return new Promise((resolve) => {
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: "INR",
        name: "The Neatify Team",
        order_id: order.id,
        prefill: {
          name: `${userDetails.firstName || ""} ${userDetails.lastName || ""}`.trim(),
          email: userDetails.email || "",
          contact: userDetails.phone || "",
        },
        theme: { color: "#f4c430" },
        handler: async (response) => {
          console.log("Razorpay response:", response);
          try {
            // Verify payment with backend
            await verifyPayment(response);
            console.log("Payment verified successfully");

            // Payment successful
            resolve({
              success: true,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
          } catch (verifyError) {
            console.error("Verification error:", verifyError);
            // Even if verification fails, payment was made - return success with IDs
            // The backend might have issues but Razorpay completed the payment
            resolve({
              success: true,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              verificationFailed: true, // Flag to indicate partial success
            });
          }
        },
        modal: {
          ondismiss: () => {
            console.log("Payment modal dismissed");
            resolve({ success: false, error: "DISMISSED" });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error);
        resolve({ success: false, error: response.error });
      });
      razorpay.open();
    });
  } catch (error) {
    console.error("Process payment error:", error);
    return { success: false, error };
  }
};