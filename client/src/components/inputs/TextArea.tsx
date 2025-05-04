import React, { useEffect, useRef } from 'react';

interface TextAreaProps {
    value: string;
    placeholder?: string;
    name: string;
    rows?: number;
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    customerror?: string;
    disabled?: boolean;
}

const TextArea: React.FC<TextAreaProps> = ({
                                               value,
                                               placeholder,
                                               name,
                                               rows = 1,
                                               onChange,
                                               customerror,
                                               disabled = false,
                                           }) => {
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (customerror && textAreaRef.current) {
            textAreaRef.current.setCustomValidity(customerror);
            textAreaRef.current.reportValidity();
        } else if (textAreaRef.current) {
            textAreaRef.current.setCustomValidity('');
            textAreaRef.current.reportValidity();
        }
    }, [customerror]);

    return (
        <div className="input-wrapper">
            <textarea
                className={`form-control ${customerror ? 'is-invalid' : ''}`}
                value={value}
                placeholder=""
                name={name}
                rows={rows}
                onChange={onChange}
                disabled={disabled}
                ref={textAreaRef}
            />
            <span className="floating-label">{placeholder}</span>
            {customerror && <div className="invalid-feedback">{customerror}</div>}
        </div>
    );
};

export default React.memo(TextArea);