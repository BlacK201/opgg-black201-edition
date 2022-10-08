import React, { useState } from "react";
// const { ipcRenderer } = globalThis.require("electron");
import {setIsSettingOpen} from "../../../redux/slices/common";
import {useDispatch} from "react-redux";
import {useTypedSelector} from "../../../redux/store";

const Menu = () => {
  const dispatch = useDispatch();
  const { isSettingOpen } = useTypedSelector(state => state.common);

  interface menuType {
    minus: MenuProps;
    setting: MenuProps;
    close: MenuProps;
  }

  const menu: menuType = {
    minus: {
      d: "M2.667 7.333H13.334V8.666H2.667z",
      transform:
        "translate(-1289.000000, -196.000000) translate(105.000000, 180.000000) translate(1184.000000, 16.000000)",
      onClick: () => {
        window.api.send("window-minimize");
      },
    },
    setting: {
      d: "M9.267 1.333l.833 1.594c.478.182.924.423 1.328.715l1.712-.072 1.267 2.194-.799 1.257c.06.318.092.645.092.979 0 .334-.031.661-.092.979l.799 1.257-1.267 2.194-1.712-.072c-.404.292-.85.533-1.328.715l-.833 1.594H6.733L5.9 13.073c-.478-.182-.924-.423-1.328-.715l-1.712.072-1.267-2.194.799-1.257C2.332 8.661 2.3 8.334 2.3 8c0-.334.031-.661.092-.979l-.799-1.257L2.86 3.57l1.712.072c.404-.292.85-.533 1.328-.715l.833-1.594h2.534zm-.808 1.334h-.918l-.694 1.327-.474.18c-.365.139-.708.324-1.021.55l-.375.27-1.366-.058-.46.795.649 1.02-.098.518c-.046.24-.069.483-.069.731s.023.492.069.73l.098.519-.648 1.02.459.795 1.366-.057.375.27c.313.225.656.41 1.021.549l.474.18.694 1.327h.918l.694-1.327.474-.18c.365-.139.708-.324 1.021-.55l.375-.27 1.366.058.46-.795-.649-1.02.098-.518c.046-.24.069-.483.069-.731s-.023-.492-.069-.73L12.2 6.75l.648-1.02-.459-.795-1.366.057-.375-.27c-.313-.225-.656-.41-1.021-.549l-.474-.18-.694-1.327zM8 5.333c1.473 0 2.667 1.194 2.667 2.667 0 1.473-1.194 2.667-2.667 2.667-1.473 0-2.667-1.194-2.667-2.667 0-1.473 1.194-2.667 2.667-2.667zm0 1.334c-.736 0-1.333.597-1.333 1.333S7.264 9.333 8 9.333 9.333 8.736 9.333 8 8.736 6.667 8 6.667z",
      transform:
        "translate(-1321.000000, -196.000000) translate(105.000000, 180.000000) translate(1184.000000, 16.000000) translate(32.000000, 0.000000)",
      onClick: () => {
        // setting
        dispatch(setIsSettingOpen(true));
      },
    },
    close: {
      d: "M12.364 2.667l.97.97L8.968 8l4.364 4.364-.97.97L8 8.968l-4.364 4.364-.97-.97L7.03 8 2.667 3.636l.97-.97L8 7.03l4.364-4.363z",
      transform:
        "translate(-1353.000000, -196.000000) translate(105.000000, 180.000000) translate(1184.000000, 16.000000) translate(64.000000, 0.000000)",
      onClick: () => {
        window.api.send("window-close");
      },
    },
  };
  return (
    <div className="menu">
      {Object.keys(menu).map((item) => (
        <div className="menu-item" key={item}>
          <MenuItem menu={menu[item]} />
        </div>
      ))}
    </div>
  );
};

export default Menu;

interface MenuProps {
  d: string;
  transform: string;
  onClick: React.MouseEventHandler<SVGSVGElement>;
}

interface MenuItemProps {
  menu: MenuProps;
}

const MenuItem: React.FC<MenuItemProps> = ({ menu }) => {
  const { d, transform, onClick } = menu;
  const [hover, setHover] = useState(false);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      onMouseOver={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <g fill="none" fillRule="evenodd">
        <g fill={hover ? "#fff" : "#7B7A8E"} fillRule="nonzero">
          <g>
            <g>
              <g>
                <path d={d} transform={transform} />
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};
