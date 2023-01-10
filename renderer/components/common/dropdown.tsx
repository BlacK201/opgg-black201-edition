import { css } from "@emotion/react";
import { memo, SyntheticEvent } from "react";
import { SerializedStyles } from "@emotion/react";
import React, { useState } from "react";
import styled from 'styled-components';
import OutsideClickHandler from "react-outside-click-handler";

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
    styles?: SerializedStyles;
}

/**
 * Dropdown 컴포넌트의 기능: 선택된 option 값의 객체를 props로 받은 onChange 함수에 담아 실행 시킨다.
 * 이외 어떠한 기능도 하지 않음
 * 기능은 props로 받은 onChange 함수에서 담당함
 */
function Dropdown({
                      options,
                      value,
                      onChange,
                      styles,
                  }: DropdownProps) {
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
        <>
            <DropdownContainer styles={styles}>
                <OutsideClickHandler onOutsideClick={handleIsClosed}>
                    <DropdownToggle
                        isOpen={isOpen}
                        onClick={handleIsOpen}
                        hasIcon={value?.icon ? true : false}
                    >
                        {value?.icon && (
                            <img src={value?.icon} width="24" height="24" alt="" />
                        )}
                        <span>{value.display ? value.display : value.label}</span>
                    </DropdownToggle>
                    {isOpen && (
                        <div>
                            {options.map((option) => (
                                <DropdownItem
                                    type="button"
                                    key={option.value}
                                    hasIcon={option?.icon ? true : false}
                                    onClick={handleOnChange(option)}
                                >
                                    {option.icon && (
                                        <img src={option.icon} width="24" height="24" alt="" />
                                    )}
                                    <span>{option.label}</span>
                                </DropdownItem>
                            ))}
                        </div>
                    )}
                </OutsideClickHandler>
            </DropdownContainer>
        </>
    );
}

export default memo(Dropdown);

const arrowStyle = `
  position: absolute;
  content: "";
  top: 50%;
  right: 8px;
  width: 0;
  height: 0;
  border: 5px solid transparent;
`;

const commonStyle = `
  display: flex;
  align-items: center;
  overflow: hidden;

  div {
    flex-basis: 24px;
  }

  span {
    display: block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  div + span {
    margin-left: 4px;
    flex: 1;
  }

  &:hover {
    // background: #eee;
  }
`;

const SelectContainer = styled.div<{
    styles?: SerializedStyles;
}>`
  font-size: 12px;

  &:after {
    ${arrowStyle}
    border-top-color: #333;
    margin-top: -2.5px;
  }

  & + & {
    margin-left: 8px;
  }

  ${({ styles }) => (styles ? styles : null)}
`;

const DropdownToggle = styled.button<{
    isOpen: boolean;
    minWidth?: number;
    hasIcon: boolean;
}>`
  ${commonStyle}
  cursor: pointer;
  outline: none;
  margin-left: 12px;
  position: relative;
  height: 36px;
  border-radius: 4px;
  text-align: left;
  box-sizing: border-box;
  border: 1px solid;
  border-color: #424254;
  background: #31313c;
  color: #fff;
  padding: ${({ hasIcon }) => (hasIcon ? "0 32px 0 6px" : "0 32px 0 16px")};
  background: ${({ isOpen }) =>
    isOpen ? "#31313c" : null};

  &:after {
    ${arrowStyle}
    margin-top: ${({ isOpen }) => (isOpen ? -7 : -2.5)}px;
    border-bottom-color: ${({ isOpen }) =>
    isOpen ? "#7b7a8e" : null};
    border-top-color: ${({ isOpen }) =>
    isOpen ? null : "#7b7a8e"};
  }

  span {
    font-size: 12px;
    margin-left: ${({ hasIcon }) => (hasIcon ? "6px" : "0")};
  }
`;
DropdownToggle.defaultProps = { type: "button" };

const DropdownContainer = styled.div<{ styles?: SerializedStyles }>`
  position: relative;
  display: inline-block;
  vertical-align: middle;

  ${DropdownToggle} + div {
    position: absolute;
    left: 12px;
    right: 0;
    top: 44px;
    width: 90px;
    z-index: 2;
    overflow-y: auto;
    border-radius: 4px;
    box-shadow: 0 8px 12px 0 rgba(0, 0, 0, 0.2);
  }

  ${({ styles }) => (styles ? styles : null)}
`;

const DropdownItem = styled.button<{ hasIcon: boolean }>`
  ${commonStyle}
  // padding: ${({ hasIcon }) => (hasIcon ? "0 12px" : "0 6px")};
  width: 100%;
  height: 36px;
  outline: none;
  border:none;
  background: #31313c;
  color: #fff;
  text-align: left;
  cursor: pointer;

  + button {
    border-top: 1px solid;
    border-top-color: #424254;
  }
  
  &:hover {
    background-color: #1c1c1f;
  }

  &:first-of-type {
    border-radius: 4px 4px 0 0;
  }

  &:last-of-type {
    border-radius: 0 0 4px 4px;
  }

  span {
    font-size: 12px;
    margin-left: ${({ hasIcon }) => (hasIcon ? "6px" : "0")};
  }
`;