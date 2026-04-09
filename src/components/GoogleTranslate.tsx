import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

export default function GoogleTranslate() {
  useEffect(() => {
    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "vi",
          includedLanguages: "vi,en,ja",
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element"
      );

      // listen khi user đổi language
      setTimeout(() => {
        const select = document.querySelector(
          ".goog-te-combo"
        ) as HTMLSelectElement | null;

        if (select) {
          select.addEventListener("change", () => {
            if (select.value === "vi") {
              // clear cookie translate
              document.cookie =
                "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              document.cookie =
                "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" +
                window.location.hostname;

              // reload về tiếng gốc
              window.location.reload();
            }
          });
        }
      }, 1000);
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div
      id="google_translate_element"
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        background: "white",
        padding: "6px 10px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
      }}
    />
  );
}