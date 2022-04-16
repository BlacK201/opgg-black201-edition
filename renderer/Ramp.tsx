import React from 'react';
import { useEffect } from 'react';

const LoadScriptByUrl = (url) => {
  useEffect(() => {
    const script = document.createElement('script');

    script.src = url;
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [url]);
};

const LoadScriptTag = (content) => {
  useEffect(() => {
    const script = document.createElement('script');

    script.innerHTML = content;
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [content]);
};

function Ramp() {
  LoadScriptTag('var ramp = { config: "https://config.playwire.com/1024437/v2/websites/73172/banner.json" };');
  LoadScriptByUrl('https://cdn.intergient.com/ramp.js');

  return (
    <div>
        Hello
        <div data-pw-desk="med_rect_atf" id="med_rect_atf" className="pw-tag"></div>
    </div>
  );
}

export default Ramp;
