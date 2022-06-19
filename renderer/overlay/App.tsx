import React, {useEffect, useState} from "react";

const App = () => {
  const baseResolution = 1920;

  const heightMul = 0.14136904761904761904761904761905;
  const iconSizeMul = 0.04861111111111111111111111111111;
  const iconMarginMul = 0.0125;
  const frameMul = 0.02986111111111111111111111111111;
  const frameMul2 = 0.00607638888888888888888888888889;

  const [skillData, setSkillData] = useState(["Q"]);
  const [level, setLevel] = useState(1);
  const [isHidden, setIsHidden] = useState(true);
  const [globalScale, setGlobalScale] = useState(1);
  const [resolutionScale, setResolutionScale] = useState(1);
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [left, setLeft] = useState(1920 / 2 - ((3.5 * 1080 * iconSizeMul) + (3 * 1080 * iconMarginMul)));
  const [bottom, setBottom] = useState(heightMul * 1080);
  const [iconSize, setIconSize] = useState(0);
  const [iconMargin, setIconMargin] = useState(0);

  useEffect(() => {
    window.api.on("lol-overlay-skill-size", (event, data) => {
      setResolutionScale(data / baseResolution);
      setWidth(data.width);
      setHeight(data.height);
      let tmpIconSize = (data.height * iconSizeMul) - (((data.height * iconSizeMul) - (data.height * iconSizeMul) * 0.66) / 100) * ((1 - data.globalScale) * 100);
      let tmpIconMargin = (data.height * iconMarginMul) - (((data.height * iconMarginMul) - (data.height * iconMarginMul) * 0.66) / 100) * ((1 - data.globalScale) * 100);
      let tmpHeight = (data.height * heightMul) - (((data.height * heightMul) - (data.height * heightMul) * 0.66) / 100) * ((1 - data.globalScale) * 100);
      setIconSize(tmpIconSize);
      setIconMargin(tmpIconMargin);
      setLeft(data.width / 2 - ((3.5 * (tmpIconSize)) + (3 * (tmpIconMargin))) - 3);
      setBottom(tmpHeight);
      setGlobalScale(data.globalScale);
    });

    window.api.on("lol-overlay-skill-globalScale", (event, data) => {
      // console.log(data);
      setGlobalScale(data);
    });

    window.api.on("lol-skill-data", (event, data) => {
      // console.log(data);
      setSkillData(data);
    });

    window.api.on("lol-levelup", (event, data) => {
      // console.log(data);
      setLevel(data);
    });

    window.api.on("lol-levelup-hide", (event, data) => {
      // console.log(data);
      setIsHidden(data);
    });
  }, []);

  return (
    <div>
      <div className={"skill-levelup"} style={{
        "bottom": bottom - (iconSize) + (iconSize * 0.59090909090909090909090909090909) + height * frameMul + (0.19 * (globalScale) * 100),
        "left": left - (height * frameMul2) - (0.06 * (globalScale) * 100),
        "width": (((iconSize) * 4) + ((iconMargin) * 3)),
        "height": (iconSize),
        // border: "1px solid red"
      }}>
        {["Q","W","E","R"].map((skill) => {
          return (
            <div style={{
              position: "relative",
              width: iconSize,
              height: iconSize,
              borderWidth: `${skillData[level] === skill ? "0" : "0"}`,
              display: `${isHidden ? "none" : "block"}`,
              visibility: `${skillData[level] === skill ? "visible" : "hidden"}`
            }}>
              <img
                style={{
                  position: "absolute",
                  width: iconSize,
                  top: 0,
                  left: 0,
                  zoom: 1.4
                }}
                src={"https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/overlay-skill.png"} />
            </div>
          );
        })}
      </div>
    </div>
  )
}

export default App;
