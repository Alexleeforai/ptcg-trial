import styles from './Card.module.css';

export default function Card({ children, className = '', hover = false, ...props }) {
    return (
        <div
            className={`${styles.card} ${hover ? styles.hoverable : ''} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
