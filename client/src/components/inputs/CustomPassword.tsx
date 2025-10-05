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
    const [hasFocus, setHasFocus] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const hiddenPasswordRef = useRef<HTMLInputElement>(null);

    // Randomly selects a masking character from the array
    const getRandomMaskCharacter = () => {
        return maskCharacters[Math.floor(Math.random() * maskCharacters.length)];
    };

    // Keep focus when password state changes
    useEffect(() => {
        if (hasFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [realPassword.length, hasFocus]);

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

    // Update hidden field handler to sync changes from autofill
    const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setRealPassword(newPassword);

        // Generate masked password for display
        const newMaskedPassword = Array.from(newPassword)
            .map(() => getRandomMaskCharacter())
            .join('');
        setMaskedPassword(newMaskedPassword);

        // Call the parent callback
        if (onPasswordChange) {
            onPasswordChange(newPassword);
        }
    };

    const handleFocus = () => {
        setHasFocus(true);
    };

    const handleBlur = () => {
        setHasFocus(false);
    };

    return (
        <div className="passwordContainer">
            {/* Hidden real password field for password managers to detect */}
            <input
                type="password"
                ref={hiddenPasswordRef}
                style={{
                    position: "absolute",
                    opacity: 0,
                    height: 0,
                    width: 0,
                    zIndex: -1
                }}
                name="password"
                id="password"
                value={realPassword}
                onChange={handleHiddenInputChange}
                autoComplete="current-password"
            />

            <input
                ref={inputRef}
                type="text"
                className="form-control"
                placeholder={placeholder}
                value={showPassword ? realPassword : maskedPassword}
                onChange={handleInput}
                onPaste={handlePaste}
                onFocus={handleFocus}
                onBlur={handleBlur}
                aria-label="Password"
                style={{ paddingRight: '3rem' }} // Make room for the toggle button
            />

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
                    <i className="fa fa-eye-slash"></i> // Hide icon
                ) : (
                    <i className="fa fa-eye"></i> // Show icon
                )}
            </button>
        </div>
    );
};