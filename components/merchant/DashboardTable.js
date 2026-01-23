'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Image from 'next/image';
import styles from '@/app/[locale]/merchant/Merchant.module.css';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// Mock data specific for the dashboard view
const INITIAL_INVENTORY = [
    {
        id: 'sv4a-350',
        image: 'https://images.pokemontcg.io/sv4pt5/237_hires.png',
        name: 'Iono (SAR)',
        set: 'Shiny Treasure ex',
        marketBuy: 950,
        marketSell: 1100,
        myBuy: 900,
        mySell: 1200,
        stock: 2
    },
    {
        id: 'sv3-134',
        image: 'https://images.pokemontcg.io/sv3/223_hires.png',
        name: 'Charizard ex (SAR)',
        set: 'Ruler of the Black Flame',
        marketBuy: 850,
        marketSell: 1150,
        myBuy: '',
        mySell: '',
        stock: 0
    },
    {
        id: 'sv2a-151',
        image: 'https://images.pokemontcg.io/sv3pt5/151_hires.png',
        name: 'Mew ex (SAR)',
        set: 'Pokemon 151',
        marketBuy: 400,
        marketSell: 550,
        myBuy: 380,
        mySell: 580,
        stock: 1
    }
];

export default function DashboardTable() {
    const t = useTranslations('Merchant');
    const [items, setItems] = useState(INITIAL_INVENTORY);
    const [loading, setLoading] = useState(null);

    const handleUpdate = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const matchMarket = (id) => {
        setItems(items.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    myBuy: item.marketBuy,
                    mySell: item.marketSell
                };
            }
            return item;
        }));
    };

    const handleSave = async (id) => {
        setLoading(id);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setLoading(null);
        alert('Prices updated!');
    };

    return (
        <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
                <div>Card</div>
                <div>Details</div>
                <div>Market Ref</div>
                <div>My Buy ($)</div>
                <div>My Sell ($)</div>
                <div>Action</div>
            </div>

            {items.map(item => (
                <div key={item.id} className={styles.tableRow}>
                    <Image
                        src={item.image}
                        alt={item.name}
                        className={styles.cardImage}
                        width={80}
                        height={112}
                        style={{ objectFit: 'cover' }}
                    />

                    <div>
                        <div className={styles.cardName}>{item.name}</div>
                        <div className={styles.cardMeta}>{item.set}</div>
                    </div>

                    <div>
                        <div style={{ fontSize: '0.85rem' }}>
                            <div style={{ color: 'var(--accent)' }}>Buy: ${item.marketBuy}</div>
                            <div style={{ color: 'var(--success)' }}>Sell: ${item.marketSell}</div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => matchMarket(item.id)}
                            style={{ fontSize: '0.7rem', height: '24px', padding: '0 8px', marginTop: '4px' }}
                        >
                            {t('matchMarket')}
                        </Button>
                    </div>

                    <div className={styles.inputGroup}>
                        <Input
                            type="number"
                            value={item.myBuy}
                            onChange={(e) => handleUpdate(item.id, 'myBuy', e.target.value)}
                            placeholder="-"
                            style={{ width: '80px', height: '36px' }}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <Input
                            type="number"
                            value={item.mySell}
                            onChange={(e) => handleUpdate(item.id, 'mySell', e.target.value)}
                            placeholder="-"
                            style={{ width: '80px', height: '36px' }}
                        />
                    </div>

                    <div className={styles.actionCell}>
                        <Button
                            size="sm"
                            onClick={() => handleSave(item.id)}
                            disabled={loading === item.id}
                        >
                            {loading === item.id ? '...' : t('save')}
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
