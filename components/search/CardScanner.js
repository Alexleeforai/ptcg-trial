'use client';

import { useState, useRef, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { useRouter } from '@/lib/navigation';
import styles from './CardScanner.module.css';

export default function CardScanner({ onClose }) {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [ocrResult, setOcrResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const router = useRouter();

    // ─────────── Handle image selection ───────────
    const handleImageChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('Image too large. Max 10MB.');
            return;
        }

        setError(null);
        setOcrResult(null);
        setImage(file);

        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(file);
    }, []);

    // ─────────── Image preprocessing with Canvas ───────────
    const preprocessImage = useCallback((imgSrc, cropBottom = false) => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Crop bottom 35% of the card (where card number + set code are)
                let sx = 0, sy = 0, sw = img.width, sh = img.height;
                if (cropBottom) {
                    sy = Math.floor(img.height * 0.65);
                    sh = img.height - sy;
                }

                // Scale up small images for better OCR
                const scale = Math.max(1, 1500 / sw);
                canvas.width = Math.floor(sw * scale);
                canvas.height = Math.floor(sh * scale);

                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

                // Convert to high-contrast grayscale
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    // Grayscale using luminance formula
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

                    // Increase contrast: stretch the range
                    let val = ((gray - 128) * 1.8) + 128;
                    val = Math.max(0, Math.min(255, val));

                    // Threshold: make text black and background white for cleaner OCR
                    const threshold = val < 140 ? 0 : 255;

                    data[i] = threshold;
                    data[i + 1] = threshold;
                    data[i + 2] = threshold;
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = imgSrc;
        });
    }, []);

    // ─────────── Extract card info from OCR text ───────────
    const extractCardInfo = useCallback((text) => {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const fullText = lines.join(' ');

        // Normalize common OCR mistakes
        const normalized = fullText
            .replace(/[oO](\d)/g, '0$1')  // O before digit → 0
            .replace(/(\d)[oO]/g, '$10')   // digit then O → 0
            .replace(/[lI|](\d)/g, '1$1')  // l/I/| before digit → 1
            .replace(/(\d)[lI|]/g, '$11'); // digit then l/I/| → 1

        // Pattern 1: Card number like "006/101", "125/165", "1/100"
        // Also handle OCR artifacts like spaces around /
        const cardNumberPatterns = [
            /(\d{1,3})\s*[\/\\|]\s*(\d{2,3})/,         // Standard: 006/101
            /(\d{1,3})\s*[\/\\|]\s*(\d{2,3})\s/,        // With trailing space
            /[#＃]\s*(\d{1,3})\s*[\/\\|]\s*(\d{2,3})/,  // With # prefix
        ];

        let cardNumberMatch = null;
        for (const pattern of cardNumberPatterns) {
            cardNumberMatch = normalized.match(pattern);
            if (cardNumberMatch) break;
        }

        // Pattern 2: Set code — more flexible patterns
        const setCodePatterns = [
            /\b(sv\d{1,2}[a-z]?)\b/i,           // sv7, sv4a, sv8
            /\b(s\d{1,2}[a-z]?)\b/i,             // s12, s12a
            /\b(m\d[a-z])\b/i,                    // m2a
            /\b(sm\d{1,2}[a-z]?)\b/i,             // sm12, sm12a
            /\b(xy\d{1,2}[a-z]?)\b/i,             // xy1, xy12a
            /\b(bw\d{1,2})\b/i,                   // bw1, bw11
            /\b(dp\d{1,2})\b/i,                   // dp1
            /\b(cs[a-z]?\d[a-z]?)\b/i,            // csm2a etc
        ];

        let setCodeMatch = null;
        for (const pattern of setCodePatterns) {
            setCodeMatch = normalized.match(pattern);
            if (setCodeMatch) break;
        }

        // Pattern 3: Card name — skip short/numeric lines
        let cardName = null;
        for (const line of lines) {
            const clean = line.replace(/[^a-zA-Z\u3000-\u9fff\uff00-\uffef\s]/g, '').trim();
            if (clean.length > 2) {
                cardName = clean;
                break;
            }
        }

        return {
            cardNumber: cardNumberMatch ? `${cardNumberMatch[1]}/${cardNumberMatch[2]}` : null,
            setCode: setCodeMatch ? setCodeMatch[1].toLowerCase() : null,
            cardName: cardName,
            rawText: text
        };
    }, []);

    // ─────────── Merge results from multiple scans ───────────
    const mergeResults = useCallback((results) => {
        const merged = { cardNumber: null, setCode: null, cardName: null, rawText: '' };
        for (const r of results) {
            if (r.cardNumber && !merged.cardNumber) merged.cardNumber = r.cardNumber;
            if (r.setCode && !merged.setCode) merged.setCode = r.setCode;
            if (r.cardName && !merged.cardName) merged.cardName = r.cardName;
            merged.rawText += (merged.rawText ? '\n---\n' : '') + r.rawText;
        }
        return merged;
    }, []);

    // ─────────── Run OCR (multi-pass) ───────────
    const handleScan = useCallback(async () => {
        if (!preview) return;

        setScanning(true);
        setProgress(0);
        setError(null);

        try {
            const results = [];

            // Pass 1: Bottom crop (card number area) — high-contrast preprocessed
            setStatusText('Scanning card number area...');
            const bottomCrop = await preprocessImage(preview, true);
            const result1 = await Tesseract.recognize(bottomCrop, 'eng', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 50));
                    }
                }
            });
            results.push(extractCardInfo(result1.data.text));

            // If we already found card number + set code, skip pass 2
            const partial = mergeResults(results);
            if (partial.cardNumber && partial.setCode) {
                setOcrResult(partial);
                return;
            }

            // Pass 2: Full image — high-contrast preprocessed
            setStatusText('Scanning full card...');
            const fullProcessed = await preprocessImage(preview, false);
            const result2 = await Tesseract.recognize(fullProcessed, 'eng', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(50 + Math.round(m.progress * 50));
                    }
                }
            });
            results.push(extractCardInfo(result2.data.text));

            const merged = mergeResults(results);
            setOcrResult(merged);

        } catch (err) {
            console.error('OCR Error:', err);
            setError('Failed to scan image. Please try another photo.');
        } finally {
            setScanning(false);
            setStatusText('');
        }
    }, [preview, preprocessImage, extractCardInfo, mergeResults]);

    // ─────────── Search with extracted info ───────────
    const handleSearch = useCallback((query, type = 'all') => {
        if (!query.trim()) return;
        router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${type}`);
        onClose();
    }, [router, onClose]);

    // ─────────── Reset ───────────
    const handleReset = useCallback(() => {
        setImage(null);
        setPreview(null);
        setOcrResult(null);
        setError(null);
        setProgress(0);
    }, []);

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <h3 className={styles.title}>📷 Scan Card</h3>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {!preview ? (
                        /* ─── Upload Area ─── */
                        <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                            <div className={styles.uploadIcon}>📸</div>
                            <p className={styles.uploadText}>Click to upload or take a photo</p>
                            <p className={styles.uploadHint}>
                                💡 Tip: Take a close-up of the card's bottom area<br />
                                where the card number is printed (e.g. 006/101)
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleImageChange}
                                className={styles.fileInput}
                            />
                        </div>
                    ) : (
                        /* ─── Preview + Results ─── */
                        <>
                            <div className={styles.previewContainer}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={preview} alt="Card preview" className={styles.previewImage} />

                                {scanning && (
                                    <div className={styles.scanOverlay}>
                                        <div className={styles.scanLine} />
                                        <div className={styles.progressText}>
                                            {statusText || 'Scanning...'} {progress}%
                                        </div>
                                        <div className={styles.progressBar}>
                                            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!ocrResult && !scanning && (
                                <div className={styles.actions}>
                                    <button className={styles.scanBtn} onClick={handleScan}>
                                        🔍 Start Scanning
                                    </button>
                                    <button className={styles.resetBtn} onClick={handleReset}>
                                        Change Image
                                    </button>
                                </div>
                            )}

                            {ocrResult && (
                                <div className={styles.results}>
                                    <h4 className={styles.resultsTitle}>Detected Info</h4>

                                    {ocrResult.cardNumber && (
                                        <div className={styles.resultRow}>
                                            <span className={styles.resultLabel}>Card #</span>
                                            <span className={styles.resultValue}>{ocrResult.cardNumber}</span>
                                            <button
                                                className={styles.searchTag}
                                                onClick={() => handleSearch(ocrResult.cardNumber)}
                                            >
                                                Search →
                                            </button>
                                        </div>
                                    )}

                                    {ocrResult.setCode && (
                                        <div className={styles.resultRow}>
                                            <span className={styles.resultLabel}>Set Code</span>
                                            <span className={styles.resultValue}>{ocrResult.setCode}</span>
                                            <button
                                                className={styles.searchTag}
                                                onClick={() => handleSearch(ocrResult.setCode, 'setCode')}
                                            >
                                                Search →
                                            </button>
                                        </div>
                                    )}

                                    {ocrResult.cardName && (
                                        <div className={styles.resultRow}>
                                            <span className={styles.resultLabel}>Name</span>
                                            <span className={styles.resultValue}>{ocrResult.cardName}</span>
                                            <button
                                                className={styles.searchTag}
                                                onClick={() => handleSearch(ocrResult.cardName)}
                                            >
                                                Search →
                                            </button>
                                        </div>
                                    )}

                                    {/* Combined search */}
                                    {ocrResult.setCode && ocrResult.cardNumber && (
                                        <div className={styles.resultRow}>
                                            <span className={styles.resultLabel}>Best Match</span>
                                            <span className={styles.resultValue}>
                                                {ocrResult.setCode} {ocrResult.cardNumber}
                                            </span>
                                            <button
                                                className={`${styles.searchTag} ${styles.searchTagPrimary}`}
                                                onClick={() => handleSearch(`${ocrResult.setCode} ${ocrResult.cardNumber}`)}
                                            >
                                                Search →
                                            </button>
                                        </div>
                                    )}

                                    {!ocrResult.cardNumber && !ocrResult.setCode && !ocrResult.cardName && (
                                        <div className={styles.noDetect}>
                                            <p>😕 Could not detect card info.</p>
                                            <p>Try a closer photo of just the bottom of the card where the number is printed.</p>
                                        </div>
                                    )}

                                    <details className={styles.rawDetails}>
                                        <summary>Raw OCR Text</summary>
                                        <pre className={styles.rawText}>{ocrResult.rawText}</pre>
                                    </details>

                                    <div className={styles.actions}>
                                        <button className={styles.resetBtn} onClick={handleReset}>
                                            Scan Another Card
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {error && (
                        <div className={styles.error}>{error}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
