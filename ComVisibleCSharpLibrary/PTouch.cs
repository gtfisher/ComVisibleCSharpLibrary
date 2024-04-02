using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;


namespace ComVisibleCSharpLibrary
{
    [Guid("B25E0195-B9F9-42F8-B554-83424A2B24D5")]
    public interface AllMethods

       
    {
        int IsThisIntMethodVisible();
        bool IsThisMethodComVisible();
        string IsThisStringMehtodVisible();

        Single GetCelsious(Single f);
        Single GetFahrenheit(Single c);

        String GetVersion();

        int ShowForm(string page);

        int CloseForm();

        void SetWorkDir(string workDIr);


    }


    [ComVisible(true)]
    [ClassInterface(ClassInterfaceType.None)]
    [Guid("16A08691-A17F-4BAE-9D3B-FA5B50F51960")]
    [ProgId("ComVisibleCSharpLibrary.PTouch")]
    public class PTouch : AllMethods
    {
        private MyWebView _form1 = null;
        public PTouch()
        {

        }

    public string GetVersion()
    {
        return "1.0.0.2";
    }

        public int CloseForm()
        {
            SimpleLog.LogText($"Info: CloseForm");

            try
            {
                SimpleLog.LogText($"Info _form null:{_form1 == null}"); 
                if ( _form1 != null )
                {
                    _form1.Close();
                    SimpleLog.LogText($"Info: CloseD");
                    _form1.Dispose();
                    SimpleLog.LogText($"Info: CloseD");
                }
               

                return 0;
            }
            catch (Exception ex)
            {
                SimpleLog.LogText(ex.ToString());
                return 0;
            }

          
            
        }

        public int ShowForm(string page)
        {
            
            SimpleLog.LogText($"Info: Show Form for page:{page}");

            if (Application.OpenForms["MyWebView"] != null)
            {
                _form1.NavigateToPage(page);
            }
            else
            {
                //if (_form1 == null)
                //{
                var form1 = new MyWebView(page);
                _form1 = form1;
                SimpleLog.LogText($"Info: Form created");
                //}

                SimpleLog.LogText($"Info: Set page");
                form1.SetPage(page);
                SimpleLog.LogText($"Info: Show Page");
                form1.Show();
            }
            
            return 0;
        }
        public Single GetFahrenheit(Single c)
        {

            SimpleLog.LogText($"Info: GetFahrenheit for c:{c}");
            Single fr = (c * 9) / 5 + 32;
            SimpleLog.LogText($"Info: f is:{fr}");
            return fr;
        }

        public Single GetCelsious(Single f)
        {
            SimpleLog.LogText($"Info: GetCelsious for f:{f}");
            Single cel = (f - 32) * 5 / 9;
            SimpleLog.LogText($"Info: c is: {cel}");
            return cel;
        }

        public bool IsThisMethodComVisible()
        {
            return true;
        }

        public string IsThisStringMehtodVisible()
        {
            return "Yes Visible";
        }

        public int IsThisIntMethodVisible()
        {
            return 1;
        }

        public void SetWorkDir(string workDir)
        {
            SimpleLog.LogText($"Info: SetWorkDir for:{workDir}");
            MyWebView._workPath = workDir;
            SimpleLog.LogText($"Info: WorkDir for:{MyWebView._workPath}");

        }



    }
}
