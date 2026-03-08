import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface LanguageSwitcherProps {
    sidebarOpened?: boolean;
}

// remove brightness and then invert
const svgToWhiteStyle = {
    filter: 'brightness(0) invert(1)'
};

const iconSize = 35; //px

const SlovakIcon = () => (
    <img
        src="/img/doublecross.svg"
        alt="Slovak Flag"
        width={iconSize}
        height={iconSize}
        style={svgToWhiteStyle}
    />
);

const CzechIcon = () => (
    <img
        src="/img/Lion.svg"
        alt="Czech Flag"
        width={iconSize}
        height={iconSize}
        style={svgToWhiteStyle}
    />
);

const UnionJackIcon = () => (
    <img
        src="/img/union-jack.svg"
        alt="Union Jack"
        width={iconSize}
        height={iconSize}
        style={svgToWhiteStyle}
    />
);

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ sidebarOpened = false }) => {
    const { t, i18n } = useTranslation();

    const languages = useMemo(() => [
        { code: "sk", label: t("language.sk"), icon: <SlovakIcon /> },
        { code: "cs", label: t("language.cs"), icon: <CzechIcon /> },
        { code: "en", label: t("language.en"), icon: <UnionJackIcon /> }
    ], [t]);

    const currentLangIndex = languages.findIndex(l => l.code === i18n.language);
    const nextLangIndex = (currentLangIndex + 1) % languages.length;
    const currentLang = languages[currentLangIndex];
    const nextLang = languages[nextLangIndex];

    const displayLabel = sidebarOpened
        ? `${t("common.currentLanguage")} ${currentLang.label}`
        : "";

    const tooltip = `${t("common.currentLanguage")} ${currentLang.label} → ${t("language.changeTo")} ${nextLang.label}`;

    return (
        <div className="language-switcher">
            <button
                type="button"
                className="active"
                title={tooltip}
                onClick={() => i18n.changeLanguage(nextLang.code)}
            >
                <span className="lang-icon">{currentLang.icon}</span>
                {sidebarOpened && (
                    <>
                        <span className="lang-label">{displayLabel}</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default LanguageSwitcher;
