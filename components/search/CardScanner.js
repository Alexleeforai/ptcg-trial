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
    const [ocrResult, setOcrResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const router = useRouter();

    // ─────────── Handle image selection ───────────
    const handleImageChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image too large. Max 10MB.');
            return;
        }

        setError(null);
        setOcrResult(null);
        setImage(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(file);
    }, []);

    // ─────────── Extract card info from OCR text ───────────
    const extractCardInfo = useCallback((text) => {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const fullText = lines.join(' ');

        // Pattern 1: Card number like "006/101", "125/165", "1/100"
        const cardNumberMatch = fullText.match(/(\d{1,3})\s*[\/\\]\s*(\d{2,3})/);

        // Pattern 2: Set code like "sv7", "m2a", "sv4a", "s12a"
        const setCodeMatch = fullText.match(/\b([sS][vV]?\d{1,2}[a-zA-Z]?|[mM]\d[a-zA-Z]|[sS]\d{1,2}[a-zA-Z]?)\b/);

        // Pattern 3: Card name (usually the biggest/first text — take first meaningful line)
        let cardName = null;
        for (const line of lines) {
            // Skip lines that are mostly numbers or very short
            if (line.length > 2 && !/^\d+[\/\\]\d+$/.test(line) && !/^[A-Z]{1,2}$/.test(line)) {
                cardName = line;
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

    // ─────────── Run OCR ───────────
    const handleScan = useCallback(async () => {
        if (!image) return;

        setScanning(true);
        setProgress(0);
        setError(null);

        try {
            const result = await Tesseract.recognize(image, 'eng+jpn', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                }
            });

            const extracted = extractCardInfo(result.data.text);
            setOcrResult(extracted);

        } catch (err) {
            console.error('OCR Error:', err);
            setError('Failed to scan image. Please try again.');
        } finally {
            setScanning(false);
        }
    }, [image, extractCardInfo]);

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
                            <p className={styles.uploadHint}>Supports JPG, PNG (max 10MB)</p>
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
                                        <div className={styles.progressText}>Scanning... {progress}%</div>
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

                                    {/* Combined search: set code + number */}
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
                                            <p>Could not detect card info. Try a clearer photo of the card's bottom area where the number is printed.</p>
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
