export default function Sidebar({ open }: any) {
  return (
    <div
      className={`
        ${open ? "w-64" : "w-0"}
        bg-[#171717] border-r border-[#2a2a2a]
        transition-all duration-300 overflow-hidden 
      `}
    >
      <div className="p-3">
        <button className="w-full bg-[#2a2a2a] hover:bg-[#333] text-sm p-2 rounded">
          + New Chat
        </button>
      </div>

      <div className="px-2 space-y-1">
        {["Chat 1", "Chat 2"].map((c, i) => (
          <div
            key={i}
            className="px-3 py-2 text-sm rounded cursor-pointer hover:bg-[#2a2a2a]"
          >
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}