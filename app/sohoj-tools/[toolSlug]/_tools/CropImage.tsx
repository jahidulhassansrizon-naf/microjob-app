"use client";
import { T as BaseT, useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop, } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Crop as CropIcon, Star, Share2, ArrowLeft, RotateCcw, Image as ImageIcon, CreditCard, Download, Upload, } from "lucide-react";
// Canvas helper function to generate cropped image
async function getCroppedImg(image: HTMLImageElement, crop: PixelCrop, format: string): Promise<Blob | null> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx)
        return null;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width * scaleX, crop.height * scaleY);
    let mimeType = "image/jpeg";
    if (format === "PNG")
        mimeType = "image/png";
    if (format === "WebP")
        mimeType = "image/webp";
    if (format === "AVIF")
        mimeType = "image/avif";
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, mimeType, 0.95);
    });
}
const getNumericAspectRatio = (val: string): number | undefined => {
    switch (val) {
        case "1:1":
            return 1;
        case "4:3":
            return 4 / 3;
        case "16:9":
            return 16 / 9;
        case "3:2":
            return 3 / 2;
        case "free":
        default:
            return undefined;
    }
};

const CROP_IMAGE_BN: Record<string, string> = {
    "Sohoj Tools": "সহজ টুলস",
    "Image Tools": "ছবির টুলস",
    "Crop Image": "ছবি কাটছাঁট",
    "Free": "বিনামূল্যে",
    "Trim images to the area you need — free or fixed aspect ratios, all in your browser.": "ছবির প্রয়োজনীয় অংশটুকু রাখুন—ইচ্ছামতো বা নির্দিষ্ট অনুপাত বেছে নিয়ে, সবকিছু আপনার ব্রাউজারেই।",
    "Aspect ratio": "ছবির অনুপাত",
    "Output format": "আউটপুট ফরম্যাট",
    "Reset": "পুনরায় শুরু করুন",
    "Crop & Download": "কাটছাঁট করে ডাউনলোড করুন",
    "Crop preview": "কাটছাঁটের পূর্বরূপ",
    "Change Image": "ছবি পরিবর্তন করুন",
    "Ready": "প্রস্তুত",
    "Empty": "খালি",
    "Click or drag an image here": "এখানে ক্লিক করুন অথবা ছবি টেনে আনুন",
    "Drag the crop handles to select the area you want to keep.": "ছবির যে অংশটি রাখতে চান, সেটি বেছে নিতে কাটছাঁটের সীমানা টেনে ঠিক করুন।",
    "Or press Ctrl+V to paste a copied image": "অথবা কপি করা ছবি পেস্ট করতে Ctrl+V চাপুন",
    "Tools in the same category": "একই বিভাগের টুলস",
    "Image Size Reducer": "ছবির আকার কমান",
    "Shrink JPG, PNG, and WebP photos in your browser — quality stays sharp.": "JPG, PNG ও WebP ছবির আকার কমান, ছবির মান অক্ষুণ্ণ রেখেই—সবকিছু আপনার ব্রাউজারেই।",
    "NID Joiner": "এনআইডির ছবি একত্র করুন",
    "Turn NID card front and back photos into a clean A4 PDF — all in your browser.": "এনআইডি কার্ডের সামনের ও পেছনের ছবি একত্র করে পরিপাটি A4 PDF তৈরি করুন—সবকিছু আপনার ব্রাউজারেই।",
    "Remove Background": "ছবির পটভূমি সরান",
    "Erase portrait, product, or logo backgrounds in your browser — download a transparent PNG.": "ব্রাউজারেই ব্যক্তি, পণ্য বা লোগোর ছবির পটভূমি সরিয়ে স্বচ্ছ PNG ডাউনলোড করুন।",
    "Source": "মূল ছবি",
    "Add to favorites": "পছন্দের তালিকায় যোগ করুন",
    "Share this tool": "এই টুল শেয়ার করুন",
    "Select an image to crop": "কাটছাঁটের জন্য ছবি নির্বাচন করুন",
};

function normalizeCropImageText(text: string): string {
    return text.replace(/\s+/g, " ").trim();
}

function CropText({ children }: { children: React.ReactNode }) {
    const { locale } = useSohozI18n();
    if (locale === "bn" && typeof children === "string") {
        const translated = CROP_IMAGE_BN[normalizeCropImageText(children)];
        if (translated) return <>{translated}</>;
    }
    return <BaseT>{children}</BaseT>;
}

export default function CropImage() {
    const { locale, L: baseL } = useSohozI18n();
    const L = (text: string) => locale === "bn"
        ? CROP_IMAGE_BN[normalizeCropImageText(text)] ?? baseL(text)
        : baseL(text);
    const [aspectRatio, setAspectRatio] = useState<string>("free");
    const [outputFormat, setOutputFormat] = useState<string>("JPG");
    const [imgSrc, setImgSrc] = useState<string>("");
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/"))
            return;
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setImgSrc(reader.result?.toString() || "");
        });
        reader.readAsDataURL(file);
    };
    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (e.clipboardData && e.clipboardData.files.length > 0) {
                const file = e.clipboardData.files[0];
                if (file.type.startsWith("image/")) {
                    handleFile(file);
                }
            }
        };
        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, []);
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const numericAspect = getNumericAspectRatio(aspectRatio);
        const newCrop = numericAspect
            ? centerCrop(makeAspectCrop({ unit: "%", width: 85 }, numericAspect, width, height), width, height)
            : { unit: "%" as const, x: 5, y: 5, width: 90, height: 90 };
        setCrop(newCrop);
    };
    const handleAspectRatioChange = (ratioVal: string) => {
        setAspectRatio(ratioVal);
        const numericAspect = getNumericAspectRatio(ratioVal);
        if (imgRef.current) {
            const { width, height } = imgRef.current;
            if (numericAspect) {
                const newCrop = centerCrop(makeAspectCrop({ unit: "%", width: 80 }, numericAspect, width, height), width, height);
                setCrop(newCrop);
            }
            else {
                setCrop({ unit: "%", x: 10, y: 10, width: 80, height: 80 });
            }
        }
    };
    const handleDownload = async () => {
        if (!imgRef.current ||
            !completedCrop ||
            !completedCrop.width ||
            !completedCrop.height)
            return;
        const blob = await getCroppedImg(imgRef.current, completedCrop, outputFormat);
        if (!blob)
            return;
        const previewUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = previewUrl;
        const ext = outputFormat.toLowerCase() === "jpg" ? "jpg" : outputFormat.toLowerCase();
        link.download = `cropped-image.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(previewUrl);
    };
    const handleReset = () => {
        setAspectRatio("free");
        setOutputFormat("JPG");
        setImgSrc("");
        setCrop(undefined);
        setCompletedCrop(undefined);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    return (<div id="crop-image-tool" className="page-font relative isolate min-h-[100dvh] w-full space-y-5 text-[#3B2F1E] font-sans">
      {/* Pointer cursor on every clickable element of this tool */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        :root:has(#crop-image-tool),
        body:has(#crop-image-tool) {
          min-height: 100%;
          background: linear-gradient(180deg, #E9DDC3 0%, #EFE5CE 100%) !important;
        }
        body:has(#crop-image-tool) { min-height: 100vh; }
        #crop-image-tool {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        #crop-image-tool::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: linear-gradient(180deg, #E9DDC3 0%, #EFE5CE 100%);
        }
        #crop-image-tool h1, #crop-image-tool h2, #crop-image-tool h3, #crop-image-tool h4 {
          letter-spacing: -0.01em;
        }
        #crop-image-tool button, #crop-image-tool a[href], #crop-image-tool input, #crop-image-tool select {
          transition-property: color, background-color, border-color, box-shadow, transform;
          transition-duration: 180ms;
        }
        #crop-image-tool button:not(:disabled):active { transform: scale(0.98); }
        #crop-image-tool button:disabled { opacity: 0.7; cursor: not-allowed; }
        #crop-image-tool button:focus-visible, #crop-image-tool a[href]:focus-visible,
        #crop-image-tool input:focus-visible, #crop-image-tool select:focus-visible {
          outline: 2px solid rgba(220, 38, 38, 0.5);
          outline-offset: 2px;
        }
        #crop-image-tool .scroll {
          scrollbar-width: thin;
          scrollbar-color: #F87171 transparent;
        }
        #crop-image-tool .scroll::-webkit-scrollbar { width: 12px; }
        #crop-image-tool .scroll::-webkit-scrollbar-track {
          background: rgba(148, 113, 67, 0.12); border-radius: 999px; margin: 10px 0;
        }
        #crop-image-tool .scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #F87171, #DC2626); border-radius: 999px;
          border: 3px solid #F2E8D2; min-height: 48px;
        }
        #crop-image-tool .scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #EF4444, #B91C1C);
        }

        :where(#crop-image-tool) a[href],
        :where(#crop-image-tool) button:not(:disabled),
        :where(#crop-image-tool) label:has(input[type="file"]),
        :where(#crop-image-tool) summary,
        :where(#crop-image-tool) select,
        :where(#crop-image-tool) input[type="color"],
        :where(#crop-image-tool) input[type="range"],
        :where(#crop-image-tool) input[type="checkbox"],
        :where(#crop-image-tool) input[type="radio"],
        :where(#crop-image-tool) input[type="file"] {
          cursor: pointer;
        }

        :where(#crop-image-tool) button:disabled {
          cursor: not-allowed;
        }
      `}</style>

      <input type="file" ref={fileInputRef} accept="image/*" aria-label={L("Select an image to crop")} className="hidden" onChange={onSelectFile}/>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-[#5A4A32]">
        <Link href="/sohoj-tools" className="flex items-center gap-1 hover:text-[#3B2F1E] transition-colors">
          <ArrowLeft size={14}/>
          <span><CropText>{"Sohoj Tools"}</CropText></span>
        </Link>
        <span><CropText>{"/"}</CropText></span>
        <span><CropText>{"Image Tools"}</CropText></span>
        <span><CropText>{"/"}</CropText></span>
        <span className="font-semibold text-[#3B2F1E]"><CropText>{"Crop Image"}</CropText></span>
      </div>

      {/* Header Card */}
      <div className="bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#FEE9E9] text-[#DC2626] rounded-xl flex items-center justify-center shrink-0 border border-[#FBB6B6]">
            <CropIcon size={24}/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#3B2F1E]"><CropText>{"Crop Image"}</CropText></h1>
              <span className="bg-emerald-100 text-emerald-700 text-[12px] font-bold px-2 py-0.5 rounded-full"><CropText>{"Free\n              "}</CropText></span>
            </div>
            <p className="text-sm text-[#5A4A32] font-medium mt-0.5"><CropText>{"Trim images to the area you need \u2014 free or fixed aspect ratios,\n              all in your browser.\n            "}</CropText></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button aria-label={L("Add to favorites")} title={L("Add to favorites")} className="p-2 text-[#7A6A50] hover:text-[#5A4A32] bg-[#F6EEDB] hover:bg-[#F3E9D2] rounded-xl transition-all border border-[#E3D6B8]">
            <Star size={16}/>
          </button>
          <button aria-label={L("Share this tool")} title={L("Share this tool")} className="p-2 text-[#7A6A50] hover:text-[#5A4A32] bg-[#F6EEDB] hover:bg-[#F3E9D2] rounded-xl transition-all border border-[#E3D6B8]">
            <Share2 size={16}/>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side Controls Panel (Sticky) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-5 self-start">
          {/* Aspect Ratio Card */}
          <div className="bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#3B2F1E]"><CropText>{"Aspect ratio"}</CropText></h2>
            <div className="grid grid-cols-5 gap-2">
              {[
            { label: "Free", value: "free" },
            { label: "1:1", value: "1:1" },
            { label: "4:3", value: "4:3" },
            { label: "16:9", value: "16:9" },
            { label: "3:2", value: "3:2" },
        ].map((ratio) => (<button key={ratio.value} onClick={() => handleAspectRatioChange(ratio.value)} className={`py-2.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${aspectRatio === ratio.value
                ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C] font-bold ring-2 ring-[#DC2626]/40 shadow-sm"
                : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:border-[#D8C9A6]"}`}>
                  <div className="w-4 h-4 border border-current rounded-xs flex items-center justify-center text-[10px]">
                    {ratio.value === "free" ? <CropText>{"..."}</CropText> : ratio.label.charAt(0)}
                  </div>
                  <span className="text-[12px]">{locale === "bn" && ratio.value === "free" ? "ইচ্ছামতো" : ratio.label}</span>
                </button>))}
            </div>
          </div>

          {/* Output Format Card */}
          <div className="bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#3B2F1E]"><CropText>{"Output format"}</CropText></h2>
            <div className="grid grid-cols-4 gap-2">
              {["JPG", "PNG", "WebP", "AVIF"].map((format) => (<button key={format} onClick={() => setOutputFormat(format)} className={`py-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${outputFormat === format
                ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C] font-bold ring-2 ring-[#DC2626]/40 shadow-sm"
                : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:border-[#D8C9A6]"}`}>
                  <span className="text-[12px] font-bold">{format}</span>
                </button>))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button onClick={handleReset} className="px-4 py-2.5 border border-[#E3D6B8] text-[#5A4A32] hover:text-[#3B2F1E] text-sm font-bold rounded-xl hover:bg-[#F6EEDB] transition-all flex items-center gap-1.5">
              <RotateCcw size={13}/><CropText>{"Reset\n            "}</CropText></button>
            <button onClick={handleDownload} disabled={!imgSrc || !completedCrop?.width} className={`flex-1 py-2.5 text-sm font-bold rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${imgSrc && completedCrop?.width
            ? "bg-[#DC2626] text-white hover:bg-[#B91C1C] cursor-pointer shadow-xs"
            : "bg-[#F3E9D2] text-[#7A6A50] cursor-not-allowed"}`}>
              <Download size={14}/><CropText>{"Crop & Download\n            "}</CropText></button>
          </div>
        </div>

        {/* Right Side Crop Preview Panel */}
        <div className="lg:col-span-8">
          <div className="bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs space-y-4 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#3B2F1E]"><CropText>{"Crop preview"}</CropText></h2>
              <div className="flex items-center gap-2">
                {imgSrc && (<button onClick={() => fileInputRef.current?.click()} className="text-[12px] bg-[#FEE9E9] text-[#DC2626] hover:bg-[#FEE9E9] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all">
                    <Upload size={12}/><CropText>{"Change Image\n                  "}</CropText></button>)}
                <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${imgSrc
            ? "bg-emerald-50 text-emerald-600 font-semibold"
            : "bg-[#F3E9D2] text-[#7A6A50]"}`}>
                  {imgSrc ? <CropText>{"Ready"}</CropText> : <CropText>{"Empty"}</CropText>}
                </span>
              </div>
            </div>

            {/* Dropzone or Crop Area */}
            {!imgSrc ? (<div onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`border border-dashed rounded-2xl p-10 min-h-[360px] flex flex-col items-center justify-center flex-1 text-center my-1 cursor-pointer transition-all ${isDragging
                ? "bg-[#FEE9E9]/80 border-[#DC2626]/50 scale-[0.99]"
                : "bg-[#F3E9D2] border-[#E3D6B8] hover:border-[#DC2626]/50 hover:bg-[#FEE9E9]/40"}`}>
                <div className="w-14 h-14 bg-[#FEE9E9] text-[#DC2626] rounded-2xl flex items-center justify-center mb-3">
                  <ImageIcon size={28}/>
                </div>
                <span className="text-sm font-bold text-[#3B2F1E] block"><CropText>{"Click or drag an image here\n                "}</CropText></span>
                <span className="text-[12px] text-[#7A6A50] mt-1"><CropText>{"Drag the crop handles to select the area you want to keep.\n                "}</CropText></span>
                <span className="text-[12px] text-[#7A6A50] mt-4 font-medium"><CropText>{"Or press Ctrl+V to paste a copied image\n                "}</CropText></span>
              </div>) : (<div className="flex-1 bg-[#F3E9D2] border border-[#E3D6B8] rounded-2xl p-3 flex items-center justify-center min-h-[360px]">
                <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} aspect={getNumericAspectRatio(aspectRatio)} className="max-w-full max-h-[360px]">
                  <img ref={imgRef} src={imgSrc} alt={L("Source")} onLoad={onImageLoad} className="max-h-[360px] w-auto max-w-full object-contain rounded-lg block mx-auto"/>
                </ReactCrop>
              </div>)}
          </div>
        </div>
      </div>

      {/* Tools in the same category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-[#3B2F1E]"><CropText>{"Tools in the same category\n        "}</CropText></h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/sohoj-tools/image-size-reducer" className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs hover:border-[#FBB6B6] transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#FEE9E9] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0">
              <ImageIcon size={16}/>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#3B2F1E] group-hover:text-[#DC2626] transition-colors"><CropText>{"Image Size Reducer\n              "}</CropText></h4>
              <p className="text-[12px] text-[#7A6A50] mt-0.5 line-clamp-2"><CropText>{"Shrink JPG, PNG, and WebP photos in your browser \u2014 quality stays\n                sharp.\n              "}</CropText></p>
            </div>
          </Link>

          <Link href="/sohoj-tools/nid-joiner" className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs hover:border-[#FBB6B6] transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#FEE9E9] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0">
              <CreditCard size={16}/>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#3B2F1E] group-hover:text-[#DC2626] transition-colors"><CropText>{"NID Joiner\n              "}</CropText></h4>
              <p className="text-[12px] text-[#7A6A50] mt-0.5 line-clamp-2"><CropText>{"Turn NID card front and back photos into a clean A4 PDF \u2014 all in\n                your browser.\n              "}</CropText></p>
            </div>
          </Link>

          <Link href="/sohoj-tools/remove-background" className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs hover:border-[#FBB6B6] transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#FEE9E9] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0"></div>
            <div>
              <h4 className="text-sm font-bold text-[#3B2F1E] group-hover:text-[#DC2626] transition-colors"><CropText>{"Remove Background\n              "}</CropText></h4>
              <p className="text-[12px] text-[#7A6A50] mt-0.5 line-clamp-2"><CropText>{"Erase portrait, product, or logo backgrounds in your browser \u2014\n                download a transparent PNG.\n              "}</CropText></p>
            </div>
          </Link>
        </div>
      </div>
    </div>);
}
