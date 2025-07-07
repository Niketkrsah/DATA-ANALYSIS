# import os
# import threading
# import traceback
# import webbrowser
# import tkinter as tk
# from tkinter import filedialog, messagebox

# from crash_analysis import run_crash_analysis
# from anr_analysis import run_anr_analysis

# class CrashANRAnalyzerApp:
#     def __init__(self, root):
#         self.root = root
#         self.root.title("Crash / ANR Analyzer")
#         self.root.geometry("450x200")

#         # === Variables ===
#         self.analysis_type = tk.StringVar(value="crash")
#         self.selected_file = tk.StringVar()

#         # === UI Elements ===
#         tk.Label(root, text="Select Analysis Type:", font=("Segoe UI", 12)).pack(pady=5)
#         btn_frame = tk.Frame(root)
#         btn_frame.pack()

#         self.crash_btn = tk.Radiobutton(btn_frame, text="Crash Log", variable=self.analysis_type, value="crash")
#         self.anr_btn = tk.Radiobutton(btn_frame, text="ANR Log", variable=self.analysis_type, value="anr")
#         self.crash_btn.pack(side=tk.LEFT, padx=10)
#         self.anr_btn.pack(side=tk.LEFT, padx=10)

#         file_frame = tk.Frame(root)
#         file_frame.pack(pady=10)
#         tk.Button(file_frame, text="Browse CSV File", command=self.browse_file).pack(side=tk.LEFT)
#         tk.Label(file_frame, textvariable=self.selected_file, wraplength=300, justify=tk.LEFT).pack(side=tk.LEFT, padx=5)

#         tk.Button(root, text="Start Analysis", font=("Segoe UI", 11, "bold"), command=self.start_analysis).pack(pady=15)

#         # === Center the window ===
#         self.root.update_idletasks()
#         w = self.root.winfo_width()
#         h = self.root.winfo_height()
#         x = (self.root.winfo_screenwidth() // 2) - (w // 2)
#         y = (self.root.winfo_screenheight() // 2) - (h // 2)
#         self.root.geometry(f'{w}x{h}+{x}+{y}')

#     def set_ui_state(self, disabled=True):
#         state = tk.DISABLED if disabled else tk.NORMAL
#         self.crash_btn.config(state=state)
#         self.anr_btn.config(state=state)
#         self.root.config(cursor="wait" if disabled else "")

#     def browse_file(self):
#         file_path = filedialog.askopenfilename(filetypes=[("CSV Files", "*.csv")])
#         if file_path:
#             self.selected_file.set(file_path)

#     def start_analysis(self):
#         file_path = self.selected_file.get()
#         if not file_path:
#             messagebox.showwarning("No File", "Please select a CSV file.")
#             return

#         analysis_type = self.analysis_type.get()
#         self.set_ui_state(True)
#         threading.Thread(target=self.run_analysis, args=(analysis_type, file_path), daemon=True).start()

#     def run_analysis(self, analysis_type, file_path):
#         try:
#             base_dir = os.path.join("output", f"{analysis_type}_report")
#             os.makedirs(base_dir, exist_ok=True)
#             output_dir = os.path.join(base_dir, os.path.splitext(os.path.basename(file_path))[0])
#             os.makedirs(output_dir, exist_ok=True)

#             if analysis_type == "crash":
#                 run_crash_analysis(file_path, output_dir)
#             else:
#                 run_anr_analysis(file_path, output_dir)

#             webbrowser.open(os.path.abspath(output_dir))
#             messagebox.showinfo("Success", f"{analysis_type.upper()} analysis completed!\n\nSaved to:\n{output_dir}")

#         except Exception as e:
#             traceback_str = traceback.format_exc()
#             messagebox.showerror("Error", f"Analysis failed:\n\n{traceback_str}")
#         finally:
#             self.set_ui_state(False)

# if __name__ == "__main__":
#     root = tk.Tk()
#     app = CrashANRAnalyzerApp(root)
#     root.mainloop()
