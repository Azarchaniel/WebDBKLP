interface IReturnInputParams {
    name: string;
    value: any;
    placeholder?: string;
}

/**
 * Returns name, value and placeholderfor input fields.
 * @param name Field's name in formData
 * @returns Object with name, value, placeholder and disabled state.
 */
export const getInputParams = (name: string, formData: any, placeholder?: string): any => {
    const keys = name.split(".");

    if (Array.isArray(formData)) {
        if (formData.length === 0) {
            return { name, value: "" };
        }
        const values = formData.map((item: any) =>
            keys.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : "", item)
        );
        const uniqueValues = Array.from(new Set(values.map(v => JSON.stringify(v)))).map(v => JSON.parse(v));

        if (uniqueValues.length === 1) {
            // Only one unique value, fill it. Don't change placeholder if it is not set
            const returnParams: IReturnInputParams = {
                name: name,
                value: getNestedValues(formData[0], keys),
            }

            if (placeholder) returnParams.placeholder = placeholder;

            return returnParams;
        } else {
            // Multiple different values
            return {
                name,
                value: "",
                placeholder: placeholder ? placeholder + " (viacero hodnôt)" : "Viacero hodnôt",
            };
        }
    }

    return {
        name: name,
        value: getNestedValues(formData, keys),
        placeholder: placeholder
    };
}

/**
 * Retrieves a nested value from an object using an array of keys.
 *
 * Iteratively accesses each key in the provided array, returning the value found at the final key,
 * or `undefined` if any key in the path does not exist.
 *
 * @param obj - The object from which to retrieve the nested value.
 * @param keys - An array of strings representing the path of keys to traverse.
 * @returns The value found at the nested path, or empty string if any key is missing.
 */
export const getNestedValues = (obj: any, keys: string[]): any => {
    return keys.reduce((current, key) => {
        if (current === undefined || current === null) {
            return ""; // Return empty string if parent is undefined/null
        }
        if (typeof current === "object" && key in current) {
            return current[key];
        }
        return ""; // Return empty string if value is missing
    }, obj);
}

/**
 * Generic handler for form input changes that works with both arrays and single objects
 * @param input - The input event or object containing name and value
 * @param formData - Current form data (can be array or single object)
 * @returns Updated form data with the new value
 * 
 * Usage:
 * const handleBookInputChange = useCallback((input: any) => {
  setFormData((prevData: any) => handleInputChange(input, prevData));
}, []);
 */
export const handleInputChange = <T>(input: any, formData: T | T[]): T | T[] => {
    let name: string, value: any;

    // Extract name and value from different input types
    if ("target" in input) {
        // If it's a DOM event
        const { name: targetName, value: targetValue } = input.target;
        name = targetName;
        value = targetValue;
    } else {
        // If it's a custom object (like from MultiSelect)
        name = input.name;
        value = input.value;
    }

    // Helper to set nested value in an object
    const setNestedValue = (obj: any, keys: string[], value: any): any => {
        if (keys.length === 0) return value;
        const [first, ...rest] = keys;
        return {
            ...obj,
            [first]: setNestedValue(obj?.[first] ?? {}, rest, value)
        };
    };

    // Split the property path into keys
    const keys = name.split(".");

    // Handle array vs single object
    if (Array.isArray(formData)) {
        // Update all items in the array
        return formData.map((item: any) => setNestedValue(item, [...keys], value));
    } else {
        // Update single object
        return setNestedValue(formData, [...keys], value);
    }
};