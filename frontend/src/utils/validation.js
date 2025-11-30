export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!re.test(email)) return "Invalid email format";
    return null;
};

export const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (!/[A-Z]/.test(password)) return "Password should contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password should contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password should contain at least one number";
    return null;
};

export const validateName = (name) => {
    if (!name) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (name.trim().length > 50) return "Name must be less than 50 characters";
    return null;
};

export const validateNotes = (notes) => {
    if (!notes || !notes.trim()) return "Notes cannot be empty";
    if (notes.trim().length < 50) return "Notes must be at least 50 characters for meaningful quiz generation";
    return null;
};
