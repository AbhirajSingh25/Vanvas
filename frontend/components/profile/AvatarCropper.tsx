"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ZoomIn, ZoomOut, RotateCcw, Check, X, Move, Camera, AlertCircle
} from "lucide-react";

interface AvatarCropperProps {
  file: File | null;
  isOpen: boolean;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
}

export function AvatarCropper({
  file,
  isOpen,
  onCropComplete,
  onCancel,
}: AvatarCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cropError, setCropError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Viewport size in pixels
  const VIEWPORT_SIZE = 260; // Clean square viewport for 360px+ screens

  // Load and validate image file
  useEffect(() => {
    if (!file || !isOpen) {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
        setImageSrc(null);
      }
      setNaturalSize(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setCropError(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCropError(null);

    const img = new Image();
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      setCropError("Unable to load the selected image. Please try a different photo.");
    };
    img.src = objectUrl;

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, isOpen]);

  // Compute scale and bounds
  const getScale = useCallback(() => {
    if (!naturalSize) return 1;
    const baseScale = Math.max(
      VIEWPORT_SIZE / naturalSize.width,
      VIEWPORT_SIZE / naturalSize.height
    );
    return baseScale * zoom;
  }, [naturalSize, zoom]);

  const clampPan = useCallback(
    (x: number, y: number, currentZoom: number = zoom) => {
      if (!naturalSize) return { x: 0, y: 0 };
      const baseScale = Math.max(
        VIEWPORT_SIZE / naturalSize.width,
        VIEWPORT_SIZE / naturalSize.height
      );
      const scale = baseScale * currentZoom;
      const scaledWidth = naturalSize.width * scale;
      const scaledHeight = naturalSize.height * scale;

      const maxPanX = Math.max(0, (scaledWidth - VIEWPORT_SIZE) / 2);
      const maxPanY = Math.max(0, (scaledHeight - VIEWPORT_SIZE) / 2);

      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, y)),
      };
    },
    [naturalSize, zoom]
  );

  // Pointer drag events for both mouse and touch
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPan(clampPan(newX, newY));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        if (containerRef.current?.hasPointerCapture(e.pointerId)) {
          containerRef.current.releasePointerCapture(e.pointerId);
        }
      } catch {}
    }
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(3, newZoom));
    setZoom(clampedZoom);
    setPan((prev) => clampPan(prev.x, prev.y, clampedZoom));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Perform the actual Canvas crop and generate a real File
  const handleApplyCrop = async () => {
    if (!file || !naturalSize) return;

    setIsProcessing(true);
    setCropError(null);

    try {
      const scale = getScale();
      const outputSize = 512; // High-DPI 512x512 output

      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Unable to initialize canvas context.");
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Calculate source image crop coordinates
      const cropSizeInSource = VIEWPORT_SIZE / scale;
      const centerXInSource = naturalSize.width / 2 - pan.x / scale;
      const centerYInSource = naturalSize.height / 2 - pan.y / scale;

      const sx = Math.max(0, Math.min(naturalSize.width - cropSizeInSource, centerXInSource - cropSizeInSource / 2));
      const sy = Math.max(0, Math.min(naturalSize.height - cropSizeInSource, centerYInSource - cropSizeInSource / 2));
      const sWidth = Math.min(cropSizeInSource, naturalSize.width - sx);
      const sHeight = Math.min(cropSizeInSource, naturalSize.height - sy);

      // Create an image element to draw from
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to process source image for cropping."));
        img.src = imageSrc || "";
      });

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, outputSize, outputSize);

      // Export to Blob (prefer WebP, fallback to JPEG)
      const blob: Blob | null = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/webp", 0.92);
      });

      if (!blob) {
        // Fallback to image/jpeg
        const fallbackBlob: Blob | null = await new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9);
        });
        if (!fallbackBlob) throw new Error("Failed to export cropped image.");
        const croppedFile = new File(
          [fallbackBlob],
          file.name.replace(/\.[^/.]+$/, "") + "_avatar.jpg",
          { type: "image/jpeg", lastModified: Date.now() }
        );
        onCropComplete(croppedFile);
        return;
      }

      const croppedFile = new File(
        [blob],
        file.name.replace(/\.[^/.]+$/, "") + "_avatar.webp",
        { type: "image/webp", lastModified: Date.now() }
      );

      onCropComplete(croppedFile);
    } catch (err: any) {
      console.error("Avatar cropping failed:", err);
      setCropError(err.message || "Could not complete image cropping. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !file) return null;

  const currentScale = getScale();
  const scaledWidth = naturalSize ? naturalSize.width * currentScale : 0;
  const scaledHeight = naturalSize ? naturalSize.height * currentScale : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop Profile Photo"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
    >
      <div className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl max-w-sm w-full p-4 sm:p-6 shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D8CBB2]/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#173B32]/10 text-[#173B32] flex items-center justify-center">
              <Camera className="w-4 h-4 text-[#173B32]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-[#173B32] leading-tight">
                Crop Profile Photo
              </h3>
              <p className="text-[10px] text-[#7B4D36] font-mono">
                1:1 Avatar Frame
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-full text-[#20211D]/60 hover:text-[#173B32] hover:bg-[#E5D5BA]/50 transition-colors cursor-pointer"
            aria-label="Cancel crop"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {cropError && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="leading-tight">{cropError}</span>
          </div>
        )}

        {/* Crop Viewport */}
        <div className="flex flex-col items-center">
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
            className="relative overflow-hidden rounded-2xl bg-[#111A16] cursor-grab active:cursor-grabbing select-none touch-none shadow-inner border border-[#D8CBB2]"
          >
            {/* The Pan & Zoom Image */}
            {imageSrc && naturalSize && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                  transform: `translate(${VIEWPORT_SIZE / 2 - scaledWidth / 2 + pan.x}px, ${
                    VIEWPORT_SIZE / 2 - scaledHeight / 2 + pan.y
                  }px)`,
                  maxWidth: "none",
                  maxHeight: "none",
                }}
                className="absolute top-0 left-0 pointer-events-none will-change-transform"
              />
            )}

            {/* Circular Crop Overlay Mask */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Outer darkened vignette */}
              <div
                style={{
                  width: VIEWPORT_SIZE - 20,
                  height: VIEWPORT_SIZE - 20,
                  boxShadow: "0 0 0 9999px rgba(15, 41, 36, 0.72)",
                }}
                className="rounded-full border-2 border-[#B49252] relative"
              >
                {/* Center crosshair indicator */}
                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                  <div className="w-4 h-[1px] bg-[#FAF4E8]" />
                  <div className="h-4 w-[1px] bg-[#FAF4E8] -ml-2" />
                </div>
              </div>
            </div>

            {/* Drag Hint Pill */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
              <span className="px-2 py-0.5 rounded-full bg-black/60 text-[#FAF7F0] text-[9px] font-mono tracking-wider backdrop-blur-xs flex items-center gap-1">
                <Move className="w-2.5 h-2.5 text-[#B49252]" />
                <span>Drag to reposition</span>
              </span>
            </div>
          </div>
        </div>

        {/* Zoom Controls & Slider */}
        <div className="space-y-1.5 px-1">
          <div className="flex items-center justify-between text-[11px] text-[#7B4D36] font-mono">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - 0.2)}
              disabled={zoom <= 1}
              className="p-1 rounded-lg text-[#173B32] hover:bg-[#E5D5BA]/60 disabled:opacity-30 cursor-pointer"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              aria-label="Zoom photo"
              className="flex-1 accent-[#173B32] cursor-pointer h-1.5 bg-[#D8CBB2] rounded-lg"
            />
            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.2)}
              disabled={zoom >= 3}
              className="p-1 rounded-lg text-[#173B32] hover:bg-[#E5D5BA]/60 disabled:opacity-30 cursor-pointer"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Reset position and zoom"
              className="p-1 rounded-lg text-[#7B4D36] hover:bg-[#E5D5BA]/60 cursor-pointer ml-1"
              aria-label="Reset zoom and position"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#D8CBB2]/60">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#20211D]/70 hover:bg-[#E5D5BA]/50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isProcessing}
            className="px-5 py-2 rounded-xl bg-[#173B32] text-xs font-bold uppercase tracking-wider text-[#EFE5D2] hover:bg-[#20453B] transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isProcessing ? (
              <span className="w-3.5 h-3.5 border-2 border-[#EFE5D2] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 text-[#B49252]" />
            )}
            <span>Crop &amp; Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
