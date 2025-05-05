import React, {useEffect, useRef} from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    customerror?: string;
}

const TextArea: React.FC<TextAreaProps> = (props: TextAreaProps) => {
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (props.customerror && textAreaRef.current) {
            textAreaRef.current.setCustomValidity(props.customerror);
            textAreaRef.current.reportValidity();
        } else if (textAreaRef.current) {
            textAreaRef.current.setCustomValidity('');
            textAreaRef.current.reportValidity();
        }
    }, [props.customerror]);

    return (
        <div className="input-wrapper">
            <textarea
                {...props}
                placeholder=""
                className={`form-control ${props.customerror ? 'is-invalid' : ''}`}
                ref={textAreaRef}
            />
            {props.placeholder && <span className="floating-label">{props.placeholder}</span>}
            {props.customerror && <div className="invalid-feedback">{props.customerror}</div>}
        </div>
    );
};

export default React.memo(TextArea);