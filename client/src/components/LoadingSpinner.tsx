import React from 'react';
import '@styles/LoadingSpinner.scss';

type LineArtBookSpinnerProps = {
    color?: string; // Color of the spinner
    size?: number;  // Size of the spinner in pixels
    marginTop?: number; // Margin top in rem
};

const LoadingSpinner: React.FC<LineArtBookSpinnerProps> = ({ color = '#fff', size = 50, marginTop = 0 }) => {
    const style = {
        '--spinner-color': color,
        '--spinner-size': `${size}px`,
        '--spinner-margin-top': `${marginTop}rem`
    } as React.CSSProperties;

    return (
        <div className="book-wrapper" style={style}>
            <div className="cover-left"></div>
            <div className="spine"></div>
            <div className="cover-right"></div>

            <div className="page page-left page-one"></div>
            <div className="page page-left page-two"></div>
            <div className="page page-left page-three"></div>

            <div className="page page-right page-one"></div>
            <div className="page page-right page-two"></div>
            <div className="page page-right page-three"></div>
            <div className="page page-right page-three animated"></div>
        </div>
    );
};

export default LoadingSpinner;