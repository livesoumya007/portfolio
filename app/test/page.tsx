"use client"

import { useState } from "react";

const Test = () => {
    const [dishName, setDishName] = useState("");    

    const handleSubmit = () => {
        
    }

    return <div>

        <form onSubmit={handleSubmit} >
            <div>
                <input name="dishName" value={dishName} onChange={(e)=>{setDishName(e.target.value)}} placeholder="write a dish name"/>
                <button type="submit">Submit</button>
            </div>
        </form>
    </div>
}

export default Test;