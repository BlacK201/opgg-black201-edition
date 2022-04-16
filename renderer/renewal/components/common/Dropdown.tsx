import { memo } from "react";
import OutsideClickHandler from "react-outside-click-handler";
import React, { useState } from "react";

interface DropdownOptionType {
    value: string | number;
    label?: string;
    icon?: string;
    display?: string;
}

interface DropdownProps {
    options: DropdownOptionType[];
    value: DropdownOptionType;
    onChange(value: DropdownOptionType): void;
    type?: string;
    highlight?: boolean;
}

/**
 * Dropdown 컴포넌트의 기능: 선택된 option 값의 객체를 props로 받은 onChange 함수에 담아 실행 시킨다.
 * 이외 어떠한 기능도 하지 않음
 * 기능은 props로 받은 onChange 함수에서 담당함
 */
function Dropdown({ options, value, onChange, type="normal", highlight=false }: DropdownProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const handleIsClosed = (
        e: React.MouseEvent<HTMLElement, globalThis.MouseEvent>
    ) => {
        e.preventDefault();
        setIsOpen(false);
    };

    const handleIsOpen = () => {
        setIsOpen(!isOpen);
    };

    const handleOnChange = (selectedValue: DropdownOptionType) => () => {
        handleIsOpen();
        onChange(selectedValue);
    };

    return (
        <div className="dropdown-container" style={{
            marginLeft: `${type !== "tft" ? "12": "0"}`
        }}>
            <OutsideClickHandler onOutsideClick={handleIsClosed}>
                <button
                    className={`dropdown-toggle ${isOpen ? "is-open" : null} ${
                        value?.icon ? "has-icon" : null
                    }`}
                    type="button"
                    onClick={handleIsOpen}
                    style={{
                        border: `${highlight ? "1px solid #fff" : ""}`,
                        borderRadius: `${highlight ? "4px" : ""}`
                    }}
                >
                    {value?.icon && (
                        <img src={value?.icon} width="24" height="24" alt="" />
                    )}
                    <span>{value.display ? value.display : value.label}</span>
                </button>
                {isOpen && (
                    <div className="dropdown-list">
                        {options.map((option) => (
                            <button
                                className={`dropdown-item ${option?.icon ? "has-icon" : null}`}
                                style={{
                                    height: `${type === "tft" ? "36px" : "40px"}`
                                }}
                                type="button"
                                key={option.value}
                                onClick={handleOnChange(option)}
                            >
                                {option.icon && (
                                    <img src={option.icon} width="24" height="24" alt="" />
                                )}
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </OutsideClickHandler>
        </div>
    );
}

export default memo(Dropdown);
