'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import styles from './CategoryGrid.module.css';

export default function CategoryGrid({ categories }) {
    const { trainers, items, pokemon } = categories;

    // Special Categories (Trainers, Items)
    const specialCats = [trainers, items];

    return (
        <div className={styles.container}>
            {/* Special Categories */}
            <h2 className={styles.sectionTitle}>Categories</h2>
            <div className={styles.specialGrid}>
                {specialCats.map(cat => (
                    <Link key={cat.name} href={`/browse/${cat.name.toLowerCase()}`} className={styles.specialCard}>
                        <div className={styles.specialImageWrapper}>
                            {cat.image ? (
                                <Image
                                    src={cat.image}
                                    alt={cat.name}
                                    fill
                                    className={styles.image}
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <div className={styles.noImage}>{cat.name}</div>
                            )}
                            <div className={styles.overlay} />
                        </div>
                        <div className={styles.specialInfo}>
                            <h3 className={styles.specialName}>
                                {cat.name === 'Trainers' ? '🧢 Trainers' : '🎒 Items'}
                            </h3>
                            <span className={styles.count}>{cat.count} Cards</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Pokemon Grid */}
            <h2 className={styles.sectionTitle} style={{ marginTop: '40px' }}>Pokemon (A-Z)</h2>
            <div className={styles.pokemonGrid}>
                {pokemon.map(p => (
                    <Link key={p.name} href={`/browse/${p.name.toLowerCase()}`} className={styles.pokemonCard}>
                        <div className={styles.pokemonImageWrapper}>
                            {p.image ? (
                                <Image
                                    src={p.image}
                                    alt={p.name}
                                    fill
                                    className={styles.image}
                                    style={{ objectFit: 'contain', padding: '10px' }}
                                />
                            ) : (
                                <div className={styles.noImage}>?</div>
                            )}
                        </div>
                        <div className={styles.pokemonInfo}>
                            <div className={styles.pokemonName}>{p.name}</div>
                            <div className={styles.pokemonCode}>{p.id}</div>
                            {p.nameCN && <div className={styles.pokemonNameCN}>({p.nameCN})</div>}
                            <div className={styles.pokemonCount}>{p.count} Cards</div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
