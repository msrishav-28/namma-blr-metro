/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';


import SvgComponent from './graphsvg';
import { SearchBox, usePath } from './SearchBox';


function MetroMapStage() {
    const [play, setPlay] = useState(false);


    const path = usePath((state: any) => state.path);



    return (
        <div>
            <SearchBox />


            <SvgComponent
                path={path}
                setPlay={setPlay}
                play={play}
            />

        </div>

    )
}

export default MetroMapStage;