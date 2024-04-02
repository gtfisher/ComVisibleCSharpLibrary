namespace WindowsFormsApp1
{
    partial class Form1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.btnShowWindow = new System.Windows.Forms.Button();
            this.comboBox1 = new System.Windows.Forms.ComboBox();
            this.tb1 = new System.Windows.Forms.TextBox();
            this.btnGetVer = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // btnShowWindow
            // 
            this.btnShowWindow.Location = new System.Drawing.Point(545, 267);
            this.btnShowWindow.Name = "btnShowWindow";
            this.btnShowWindow.Size = new System.Drawing.Size(136, 48);
            this.btnShowWindow.TabIndex = 0;
            this.btnShowWindow.Text = "Show Window";
            this.btnShowWindow.UseVisualStyleBackColor = true;
            this.btnShowWindow.Click += new System.EventHandler(this.btnShowWindow_Click);
            // 
            // comboBox1
            // 
            this.comboBox1.FormattingEnabled = true;
            this.comboBox1.Items.AddRange(new object[] {
            "hello.html",
            "load3.html"});
            this.comboBox1.Location = new System.Drawing.Point(192, 267);
            this.comboBox1.Name = "comboBox1";
            this.comboBox1.Size = new System.Drawing.Size(121, 28);
            this.comboBox1.TabIndex = 1;
            // 
            // tb1
            // 
            this.tb1.Location = new System.Drawing.Point(80, 28);
            this.tb1.Multiline = true;
            this.tb1.Name = "tb1";
            this.tb1.Size = new System.Drawing.Size(323, 195);
            this.tb1.TabIndex = 2;
            // 
            // btnGetVer
            // 
            this.btnGetVer.Location = new System.Drawing.Point(545, 63);
            this.btnGetVer.Name = "btnGetVer";
            this.btnGetVer.Size = new System.Drawing.Size(136, 41);
            this.btnGetVer.TabIndex = 3;
            this.btnGetVer.Text = "Get Version";
            this.btnGetVer.UseVisualStyleBackColor = true;
            this.btnGetVer.Click += new System.EventHandler(this.btnGetVer_Click);
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(9F, 20F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(800, 450);
            this.Controls.Add(this.btnGetVer);
            this.Controls.Add(this.tb1);
            this.Controls.Add(this.comboBox1);
            this.Controls.Add(this.btnShowWindow);
            this.Name = "Form1";
            this.Text = "Form1";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Button btnShowWindow;
        private System.Windows.Forms.ComboBox comboBox1;
        private System.Windows.Forms.TextBox tb1;
        private System.Windows.Forms.Button btnGetVer;
    }
}

