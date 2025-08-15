[![logo-info.png](https://i.postimg.cc/NM7Z2S0W/logo-info.png)](https://postimg.cc/gXjgfM8D)
# Ten Shovar - Ten Bis Voucher Viewer

**Ten Shovar** is a browser extension for Google Chrome and Microsoft Edge that streamlines the process of viewing and managing gift vouchers on the Israeli "Just Eat" (known as Ten Bis) platform. This extension provides an intuitive popup interface directly on the website, solving the limitations of the native voucher display.

![A GIF showing how the extension works](https://media.giphy.com/media/307w0EZMIAJVVHbtEh/giphy.gif)

## 🎯 The Problem

The native voucher management interface on the Ten Bis website and app is **practically non-existent**. Vouchers are not displayed in a dedicated section but are instead **hidden within a user's transaction history**, requiring them to:

* **Sift through an entire list of past orders** to find the voucher details.
* **Struggle with a messy and unclear view** where there is no distinction between used and unused vouchers.
* **Work with voucher numbers only**, with no scannable barcodes available.

## 🚀 The Solution

Ten Shovar was developed to provide a seamless and efficient user experience. It pulls voucher data from the website's API and presents it in a clean, easily accessible popup. The extension features include:

* **Barcode Generation:** Automatically converts voucher numbers into scannable barcodes.
* **Copy to Clipboard:** One-click functionality to copy voucher numbers to your clipboard.
* **PDF Export:** Download a PDF file containing all your vouchers and their barcodes for offline use.
* **Simplified Interface:** A user-friendly popup that filters out used vouchers and presents information clearly.

## 💻 Technologies Used

This project is built using standard web technologies:

* **HTML:** The structure of the extension's popup and user interface.
* **CSS:** The styling and visual design, ensuring a clean and modern look.
* **JavaScript:** The core logic, handling all functionalities from API calls to barcode generation and user interactions.

### API Communication

The extension communicates with the website's backend using **API calls** to fetch the voucher data. These calls are asynchronous, meaning the data is requested in the background without freezing the user interface.

## 🚧 CORS Workaround

Due to the way the "Ten Bis" platform is structured, the information about your purchases and vouchers is scattered across multiple domains. This presents a security challenge, as standard browser policies (Cross-Origin Resource Sharing - **CORS**) prevent a webpage from making requests to a different domain.

To address this, you have two primary options:

1.  **Use a CORS Bypass Extension:** You can try running this extension alongside a dedicated CORS bypass extension. **However, please note that this method may lead to HTTP errors and might not work consistently.**
2.  **Disable Web Security:** To fetch the complete voucher data from all the necessary sources, you can run your browser with web security disabled.

**This is a temporary workaround for development and should be used with caution.** It is highly recommended to **use a single browser instance with no other tabs open besides the "Ten Bis" website** to minimize security risks.

#### Windows Run

**For Google Chrome:**
    ```
    chrome.exe --disable-web-security --user-data-dir="C:/ChromeDevSession"
    ```

**For Microsoft Edge:**
    ```
    msedge.exe --disable-web-security --user-data-dir="C:/EdgeDevSession"
    ```

*Note: `--user-data-dir` specifies a separate user profile to avoid conflicts with your main browser session.*

## ⚙️ Installation & Usage

1.  **Clone the Repository:**
    ```
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    ```
2.  **Enable Developer Mode:**
    * Navigate to `chrome://extensions` or `edge://extensions`.
    * Toggle on "Developer mode" in the top-right corner.
3.  **Load the Extension:**
    * Click "Load unpacked".
    * Select the directory where you cloned the repository.
4.  **Use the Extension:**
    * Navigate to the "Ten Bis" website.
    * Click the extension icon in your browser's toolbar. The popup will appear, displaying your vouchers.

## 📄 License

This project is licensed under the **MIT License**.
See the [LICENSE](LICENSE) file for details.
