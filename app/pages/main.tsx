"use client"
import  { useState } from "react";
import { useEffect } from "react";
import { json } from "stream/consumers";
import axios from "axios";

function Main() {
  const [file, setFile] = useState(null);
  const [res , setRes] = useState()
  const [text, setText] = useState("")

  function addDoc() {
    const el = document.createElement("input");
    el.type = "file";
    el.accept = "image/png,application/pdf";

    el.onchange = async (e) => {
      const selectedFile = e.target.files[0];

      if (!selectedFile) return;

      setFile(selectedFile); // ✅ trigger re-render

      const formData = new FormData();
      formData.append("pdf", selectedFile);
      formData.append("user","Client")

      console.log(selectedFile);

     const response = await axios.get("http://localhost:4000")
     const data = response.data;
     console.log(data)

     const sendPdf = await axios.post("http://localhost:4000/upload",formData)
      const res =  sendPdf.data;
      console.log(res.message);

      setRes(res.message);
    };

    el.click();
  }

  return (
    <div className="">
    <div className="flex  items-center justify-center overflow-hidden ">
    <div className="flex p-2 justify-center flex-col items-center m-10">
      <button className="border  rounded-2xl p-1" onClick={addDoc}>Upload PDF</button>

      {file && (
        <div className="bg-white text-black mt-4 p-2">
          PDF created: {file.name}
        </div>
      )}

      <div className=" border flex flex-col p-10">
        Enter Your Query : 
        <div className="p-1">
          <label >
            <input className="border " id ="user_input" value={text} onChange={(e)=>setText(e.target.value)} />
          </label>
        </div>
      

        <div className="flex justify-center border p-3 ">
        <div className="border m-10 rounded-2xl flex w-20 justify-center items-center  max-h-full">
          <p>hello </p>
        </div>
        </div>
      
        
      </div>
    </div>
    </div>
    </div>
  );
}

export default Main;
