export default function AppLogo() {
    return (
        <div className="flex items-center gap-2">
            <img
                src="/Logo.png"
                alt="RAPEX logo"
                className="h-10 w-10 object-contain"
            />
            <img
                src="/text-textured.png"
                alt="RAPEX"
                className="h-12 w-24 object-contain"
            />
        </div>
    );
}
