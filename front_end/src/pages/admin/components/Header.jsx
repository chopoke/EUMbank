
export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Service Overview</h2>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <i className="ri-search-line text-xl"></i>
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <i className="ri-notification-line text-xl"></i>
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">JD</span>
            </div>
            <span className="text-gray-700 font-medium">John Doe</span>
          </div>
        </div>
      </div>
    </header>
  );
}
