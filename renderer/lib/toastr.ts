import toastr from "toastr";

export const initToastr = () => {
    toastr.options = {
        "closeButton": true,
        "progressBar": true,
        // "timeOut": 0,
        // "extendedTimeOut": 0,
        "positionClass": "toast-bottom-right",
    };
};

export default toastr;