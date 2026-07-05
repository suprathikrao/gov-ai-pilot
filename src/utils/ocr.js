export async function runLocalOcr(file) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("Please choose an image file such as JPG or PNG.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        text: `Image uploaded: ${file.name}\n\nThis prototype can attach the image and show the filename. For real OCR text extraction, the backend OCR endpoint should be used from a server-side environment with Tesseract installed.`,
        confidence: null,
      });
    };
    reader.onerror = () => reject(new Error("Could not read the selected image file."));
    reader.readAsDataURL(file);
  });
}
