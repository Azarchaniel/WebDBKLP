/**
 * Returns name, value and placeholderfor input fields.
 * @param name Field's name in formData
 * @returns Object with name, value, placeholder and disabled state.
 */
export const getInputParams = (name: string, formData: any): any => {
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
            // Only one unique value, fill it
            return {
                name: name,
                value: getNestedValues(formData[0], keys),
            };
        } else {
            // Multiple different values
            return {
                name,
                value: "",
                placeholder: "Viacero hodnôt",
            };
        }
    }

    return {
        name: name,
        value: getNestedValues(formData, keys),
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
 * @returns The value found at the nested path, or `undefined` if any key is missing.
 */
export const getNestedValues = (obj: any, keys: string[]): any => {
    return keys.reduce((current, key) => {
        if (current && typeof current === "object" && key in current) {
            return current[key];
        }
        return ""; // Return empty string if value is missing
    }, obj);
}