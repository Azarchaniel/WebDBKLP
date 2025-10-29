import React, { useRef, useState, useEffect } from "react";

interface PasswordFieldProps {
    maskCharacters?: string[];
    onPasswordChange?: (password: string) => void; // Pass real password back to parent
    placeholder?: string;
}

export const CustomPasswordField: React.FC<PasswordFieldProps> = ({
    maskCharacters = ['*', '•', '✦', '✪'], // Default mask characters
    onPasswordChange,
    placeholder = 'Enter your password',
}) => {
    const [maskedPassword, setMaskedPassword] = useState(''); // Masked display value
    const [realPassword, setRealPassword] = useState(''); // Actual stored password
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const hiddenPasswordRef = useRef<HTMLInputElement>(null);

    // Randomly selects a masking character from the array
    const getRandomMaskCharacter = () => {
        return maskCharacters[Math.floor(Math.random() * maskCharacters.length)];
    };

    const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        const cursorPosition = event.target.selectionStart || 0;

        // Handle backspace and delete at specific positions
        if (inputValue.length < maskedPassword.length) {
            // Calculate which characters were deleted
            const numDeleted = maskedPassword.length - inputValue.length;
            const deleteStartPos = cursorPosition;

            // Update the real password by removing characters at the cursor position
            const newRealPassword =
                realPassword.substring(0, deleteStartPos) +
                realPassword.substring(deleteStartPos + numDeleted);

            // Update the masked password similarly
            const newMaskedPassword =
                maskedPassword.substring(0, deleteStartPos) +
                maskedPassword.substring(deleteStartPos + numDeleted);

            setRealPassword(newRealPassword);
            setMaskedPassword(newMaskedPassword);

            // Update the hidden password field for password managers
            if (hiddenPasswordRef.current) {
                hiddenPasswordRef.current.value = newRealPassword;
            }

            // Call the parent callback
            if (onPasswordChange) {
                setTimeout(() => onPasswordChange(newRealPassword), 0);
            }

            // Need to restore cursor position after React updates the DOM
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.selectionStart = deleteStartPos;
                    inputRef.current.selectionEnd = deleteStartPos;
                }
            }, 0);

            return;
        }

        // Handle insertion at a specific position
        if (inputValue.length > maskedPassword.length) {
            const prevCursorPosition = cursorPosition - (inputValue.length - maskedPassword.length);
            const addedCharacters = inputValue.substring(prevCursorPosition, cursorPosition);

            // Generate masked characters
            const newMaskedCharacters = Array.from(addedCharacters)
                .map(() => getRandomMaskCharacter())
                .join('');

            // Insert the new characters at the cursor position
            const newRealPassword =
                realPassword.substring(0, prevCursorPosition) +
                addedCharacters +
                realPassword.substring(prevCursorPosition);

            const newMaskedPassword =
                maskedPassword.substring(0, prevCursorPosition) +
                newMaskedCharacters +
                maskedPassword.substring(prevCursorPosition);

            setRealPassword(newRealPassword);
            setMaskedPassword(newMaskedPassword);

            // Update the hidden password field for password managers
            if (hiddenPasswordRef.current) {
                hiddenPasswordRef.current.value = newRealPassword;
            }

            // Call the parent callback
            if (onPasswordChange) {
                setTimeout(() => onPasswordChange(newRealPassword), 0);
            }

            // Restore cursor position after React updates the DOM
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.selectionStart = cursorPosition;
                    inputRef.current.selectionEnd = cursorPosition;
                }
            }, 0);

            return;
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();

        const pastedText = event.clipboardData.getData('text');
        const cursorPosition = inputRef.current?.selectionStart || 0;

        // Generate masked characters for pasted text
        const newMaskedCharacters = Array.from(pastedText)
            .map(() => getRandomMaskCharacter())
            .join('');

        // Insert pasted text at cursor position
        const newRealPassword =
            realPassword.substring(0, cursorPosition) +
            pastedText +
            realPassword.substring(cursorPosition);

        const newMaskedPassword =
            maskedPassword.substring(0, cursorPosition) +
            newMaskedCharacters +
            maskedPassword.substring(cursorPosition);

        setRealPassword(newRealPassword);
        setMaskedPassword(newMaskedPassword);

        // Update the hidden password field for password managers
        if (hiddenPasswordRef.current) {
            hiddenPasswordRef.current.value = newRealPassword;
        }

        // Call the parent callback
        if (onPasswordChange) {
            setTimeout(() => onPasswordChange(newRealPassword), 0);
        }

        // Set cursor position after paste
        const newPosition = cursorPosition + pastedText.length;
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.selectionStart = newPosition;
                inputRef.current.selectionEnd = newPosition;
            }
        }, 0);
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev); // Toggle the showPassword state
    };

    return (
        <div className="passwordContainer">
            {realPassword.length === 0 ? (
                <input
                    type="password"
                    className="form-control"
                    onChange={handleInput}
                    value={realPassword}
                    placeholder={placeholder}
                />
            ) : (
                <input
                    ref={inputRef}
                    type="text"
                    className="form-control"
                    placeholder={placeholder}
                    value={showPassword ? realPassword : maskedPassword}
                    onChange={handleInput}
                    onPaste={handlePaste}
                    autoComplete="true"
                />
            )}

            {/* Always render the button but conditionally show it */}
            <button
                type="button"
                onClick={togglePasswordVisibility}
                className="passwordToggle"
                title={showPassword ? 'Skry heslo' : 'Zobraz heslo'}
                style={{
                    display: realPassword.length > 0 ? 'flex' : 'none'
                }}
            >
                {showPassword ? (
                    <i className="fa fa-eye-slash"></i>
                ) : (
                    <i className="fa fa-eye"></i>
                )}
            </button>
        </div>
    );
};