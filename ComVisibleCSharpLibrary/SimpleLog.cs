using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ComVisibleCSharpLibrary
{
    public static class SimpleLog
    {

        public static void LogText(string msg)
        {
            var path = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile) + $"/.logs";
            bool exists = System.IO.Directory.Exists(path);

            if (!exists)
                System.IO.Directory.CreateDirectory(path);

            
            var logPath = Path.Combine(path, "log.txt");

            string time = DateTime.Now.ToShortTimeString();
            string date = DateTime.Now.ToShortDateString();

            //MessageBox.Show(logPath);
            if (!File.Exists(logPath))
                using (StreamWriter sw = File.CreateText(logPath))
                {
                    sw.WriteLine($"{date} {time} {msg}");
                }
            else
                using (StreamWriter sw = File.AppendText(logPath))
                {
                    sw.WriteLine($"{date} {time} {msg}");

                }

        }
    }
}
