
export const getSettingInLocalStorage = (key: string) => {
    return localStorage.getItem(key) !== "false";
}
