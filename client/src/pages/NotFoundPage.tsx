import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "1rem", padding: "2rem" }}>
            <h1 style={{ fontSize: "6rem", margin: 0, color: "var(--anchor)" }}>404</h1>
            <h2 style={{ margin: 0, color: "black" }}>{t("page404.title")}</h2>
            <p style={{ color: "#888" }}>{t("page404.message")}</p>
            <Link to="/" style={{ color: "var(--anchor)" }}>{t("page404.goHome")}</Link>
        </div>
    );
};

export default NotFoundPage;
