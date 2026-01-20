import styles from './Input.module.css';

export default function Input({
    icon,
    className = '',
    wrapperClassName = '',
    ...props
}) {
    return (
        <div className={`${styles.wrapper} ${wrapperClassName}`}>
            {icon && <span className={styles.icon}>{icon}</span>}
            <input
                className={`${styles.input} ${icon ? styles.withIcon : ''} ${className}`}
                {...props}
            />
        </div>
    );
}
